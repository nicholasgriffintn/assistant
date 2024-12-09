import { AwsClient } from "aws4fetch";

import type { EmbeddingProvider } from "../../types";
import { AppError } from "../../utils/errors";

export interface BedrockEmbeddingProviderConfig {
	knowledgeBaseId: string;
	knowledgeBaseCustomDataSourceId?: string;
	region?: string;
	accessKeyId: string;
	secretAccessKey: string;
}

export class BedrockEmbeddingProvider implements EmbeddingProvider {
	private aws: AwsClient;
	private knowledgeBaseId: string;
	private knowledgeBaseCustomDataSourceId?: string;
	private region: string;
	private agentEndpoint: string;
	private agentRuntimeEndpoint: string;

	constructor(config: BedrockEmbeddingProviderConfig) {
		this.knowledgeBaseId = config.knowledgeBaseId;
		this.knowledgeBaseCustomDataSourceId =
			config.knowledgeBaseCustomDataSourceId;
		this.region = config.region || "us-east-1";
		this.agentEndpoint = `https://bedrock-agent.${this.region}.amazonaws.com`;
		this.agentRuntimeEndpoint = `https://bedrock-agent-runtime.${this.region}.amazonaws.com`;

		this.aws = new AwsClient({
			accessKeyId: config.accessKeyId,
			secretAccessKey: config.secretAccessKey,
			region: this.region,
			service: "bedrock",
		});
	}

	async generate(
		type: string,
		content: string,
		id: string,
		metadata: Record<string, any>,
	): Promise<any[]> {
		try {
			if (!type || !content || !id) {
				throw new AppError("Missing type, content or id from request", 400);
			}

			return [
				{
					type,
					content,
					id,
					metadata,
				},
			];
		} catch (error) {
			console.error("Bedrock Embedding API error:", error);
			throw error;
		}
	}

	async insert(embeddings: any[]): Promise<any> {
		const url = `${this.agentEndpoint}/knowledgebases/${this.knowledgeBaseId}/datasources/${this.knowledgeBaseCustomDataSourceId}/documents`;

		// TODO: Support file uploads: https://docs.aws.amazon.com/bedrock/latest/APIReference/API_agent_IngestKnowledgeBaseDocuments.html
		const body = JSON.stringify({
			documents: embeddings.map((embedding) => ({
				content: {
					dataSourceType: "CUSTOM",
					custom: {
						customDocumentIdentifier: {
							id: embedding.id,
						},
						sourceType: "IN_LINE",
						inlineContent: {
							type: "TEXT",
							textContent: {
								data: embedding.content,
							},
						},
					},
				},
				metadata: {
					type: "IN_LINE_ATTRIBUTE",
					inlineAttributes: Object.keys(embedding.metadata).map((key) => ({
						key,
						value: {
							type: "STRING",
							stringValue: embedding.metadata[key],
						},
					})),
				},
			})),
		});

		const response = await this.aws.fetch(url, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
			},
			body,
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(
				`Bedrock Knowledge Base API error: ${response.statusText} - ${errorText}`,
			);
		}

		const data = (await response.json()) as any;

		return data;
	}

	async getQuery(query: string): Promise<string> {
		return query;
	}

	async getMatches(queryVector: string) {
		const query = await this.getQuery(queryVector);

		// todo: look at other config: https://docs.aws.amazon.com/bedrock/latest/APIReference/API_agent-runtime_Retrieve.html
		const url = `${this.agentRuntimeEndpoint}/knowledgebases/${this.knowledgeBaseId}/retrieve`;

		const body = JSON.stringify({
			retrievalQuery: {
				text: query,
			},
		});

		const response = await this.aws.fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body,
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(
				`Bedrock Knowledge Base API error: ${response.statusText} - ${errorText}`,
			);
		}

		const data = (await response.json()) as any;

		return data;
	}

	async searchSimilar(
		query: string,
		options: {
			topK?: number;
			scoreThreshold?: number;
		} = {},
	) {
		const matchesResponse = await this.getMatches(query);

		if (!matchesResponse.retrievalResults.length) {
			throw new AppError("No matches found", 400);
		}

		return matchesResponse.retrievalResults;
	}
}
