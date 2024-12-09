import type { EmbeddingProvider } from "../../types";
import { AppError } from "../../utils/errors";
import {
	VectorizeEmbeddingProvider,
	type VectorizeEmbeddingProviderConfig,
} from "./vectorize";
import {
	BedrockEmbeddingProvider,
	type BedrockEmbeddingProviderConfig,
} from "./bedrock";

// biome-ignore lint/complexity/noStaticOnlyClass: I prefer this pattern
export class EmbeddingProviderFactory {
	static getProvider(
		type: string,
		config: VectorizeEmbeddingProviderConfig | BedrockEmbeddingProviderConfig,
	): EmbeddingProvider {
		switch (type) {
			case "bedrock":
				if (!("knowledgeBaseId" in config)) {
					throw new AppError("Invalid config for Bedrock provider", 400);
				}
				return new BedrockEmbeddingProvider(config);
			case "vectorize":
				if (!("ai" in config)) {
					throw new AppError("Invalid config for Vectorize provider", 400);
				}
				return new VectorizeEmbeddingProvider(config);
			default:
				throw new AppError(`Unsupported embedding provider: ${type}`, 400);
		}
	}
}
