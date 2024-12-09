import type { GuardrailsProvider } from "../../types";
import { AppError } from "../../utils/errors";
import {
	type BedrockGuardrailsConfig,
	BedrockGuardrailsProvider,
} from "./bedrock";
import { type LlamaGuardConfig, LlamaGuardProvider } from "./llamaguard";

// biome-ignore lint/complexity/noStaticOnlyClass: I prefer this pattern
export class GuardrailsProviderFactory {
	static getProvider(
		type: string,
		config: BedrockGuardrailsConfig | LlamaGuardConfig,
	): GuardrailsProvider {
		switch (type) {
			case "bedrock":
				if (!("guardrailId" in config)) {
					throw new AppError("Invalid config for Bedrock provider", 400);
				}
				return new BedrockGuardrailsProvider(config);
			case "llamaguard":
				if (!("ai" in config)) {
					throw new AppError("Invalid config for LlamaGuard provider", 400);
				}
				return new LlamaGuardProvider(config as LlamaGuardConfig);
			default:
				throw new AppError(`Unsupported guardrails provider: ${type}`, 400);
		}
	}
}
