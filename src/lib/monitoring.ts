import type { AnalyticsEngineDataset } from "@cloudflare/workers-types";

import { AssistantError } from "../utils/errors";

export interface Metric {
	traceId: string;
	timestamp: number;
	type: "performance" | "error" | "usage";
	name: string;
	value: number;
	metadata: Record<string, any>;
	status: "success" | "error";
	error?: string;
}

export class Monitoring {
	private static instance: Monitoring;
	private metrics: Metric[] = [];
	private analyticsEngine: AnalyticsEngineDataset;

	private constructor(analyticsEngine?: AnalyticsEngineDataset) {
		if (!analyticsEngine) {
			throw new AssistantError("Analytics Engine not configured");
		}

		this.analyticsEngine = analyticsEngine;
	}

	public static getInstance(
		analyticsEngine?: AnalyticsEngineDataset,
	): Monitoring {
		if (!Monitoring.instance) {
			Monitoring.instance = new Monitoring(analyticsEngine);
		}
		return Monitoring.instance;
	}

	public recordMetric(metric: Metric): void {
		if (!this.validateMetric(metric)) {
			console.warn("Invalid metric structure:", metric);
			return;
		}

		this.metrics.push(metric);

		if (this.analyticsEngine) {
			this.analyticsEngine.writeDataPoint({
				blobs: [
					metric.type,
					metric.name,
					metric.status,
					metric.error || "None",
					metric.traceId,
					JSON.stringify(metric.metadata),
				],
				doubles: [metric.value, metric.timestamp],
				indexes: [metric.traceId],
			});
		} else {
			console.log(
				`[Metric] ${metric.type}:${metric.name}`,
				JSON.stringify(
					{
						value: metric.value,
						status: metric.status,
						metadata: metric.metadata,
						error: metric.error || "",
					},
					null,
					2,
				),
			);
		}
	}

	private validateMetric(metric: Metric): boolean {
		return (
			typeof metric.traceId === "string" &&
			typeof metric.timestamp === "number" &&
			["performance", "error", "usage"].includes(metric.type) &&
			typeof metric.name === "string" &&
			typeof metric.value === "number"
		);
	}

	public getMetrics(): Metric[] {
		return this.metrics;
	}

	public getMetricsByType(type: Metric["type"]): Metric[] {
		return this.metrics.filter((metric) => metric.type === type);
	}

	public getMetricsByName(name: string): Metric[] {
		return this.metrics.filter((metric) => metric.name === name);
	}

	public clearMetrics(): void {
		this.metrics = [];
	}
}

export function trackUsageMetric(
	userId: string,
	analyticsEngine?: AnalyticsEngineDataset,
): void {
	const monitor = Monitoring.getInstance(analyticsEngine);
	const traceId = crypto.randomUUID();

	monitor.recordMetric({
		traceId,
		timestamp: Date.now(),
		type: "usage",
		name: "user_usage",
		value: 1,
		metadata: {
			userId,
		},
		status: "success",
	});
}

// TODO: Track the settings used for the request
export function trackProviderMetrics<T>({
	provider,
	model,
	operation,
	analyticsEngine,
	settings,
	usage,
}: {
	provider: string;
	model: string;
	operation: () => Promise<T>;
	analyticsEngine?: AnalyticsEngineDataset;
	settings?: {
		temperature?: number;
		max_tokens?: number;
		top_p?: number;
		top_k?: number;
		seed?: number;
		repetition_penalty?: number;
		frequency_penalty?: number;
		presence_penalty?: number;
	};
	usage?: {
		input_tokens: number;
		output_tokens: number;
	};
}): Promise<T> {
	const startTime = performance.now();
	const monitor = Monitoring.getInstance(analyticsEngine);
	const traceId = crypto.randomUUID();

	return operation()
		.then((result: any) => {
			const metrics = {
				provider,
				model,
				latency: performance.now() - startTime,
				tokenUsage: result?.usage,
				systemFingerprint: result?.system_fingerprint,
				logId: result?.logId,
				settings: {
					temperature: settings?.temperature,
					max_tokens: settings?.max_tokens,
					top_p: settings?.top_p,
					top_k: settings?.top_k,
					seed: settings?.seed,
					repetition_penalty: settings?.repetition_penalty,
					frequency_penalty: settings?.frequency_penalty,
					presence_penalty: settings?.presence_penalty,
				},
			};

			monitor.recordMetric({
				traceId,
				timestamp: Date.now(),
				type: "performance",
				name: "ai_provider_response",
				value: metrics.latency,
				metadata: metrics,
				status: "success",
			});

			return result;
		})
		.catch((error) => {
			monitor.recordMetric({
				traceId,
				timestamp: Date.now(),
				type: "error",
				name: "ai_provider_response",
				value: performance.now() - startTime,
				metadata: {
					provider,
					model,
					settings,
					error: error instanceof Error ? error.message : String(error),
				},
				status: "error",
				error: error instanceof Error ? error.message : String(error),
			});
			throw error;
		});
}

// TODO: Add a function to track guardrail violations

// TODO: Track RAG performance

// TODO: Track model routing performance