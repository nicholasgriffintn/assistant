import { Embedding } from "../../lib/embedding";
import type { IRequest } from "../../types";
import { AssistantError, ErrorType } from "../../utils/errors";

// @ts-ignore
export interface IInsertEmbeddingRequest extends IRequest {
	request: {
		type: string;
		content: string;
		id: string;
		metadata: Record<string, any>;
		title: string;
	};
}

export const insertEmbedding = async (
	req: IInsertEmbeddingRequest,
): Promise<any> => {
	try {
		const { request, env } = req;

		const { type, content, id, metadata, title } = request;

		if (!type) {
			throw new AssistantError(
				"Missing type from request",
				ErrorType.PARAMS_ERROR,
			);
		}
		if (!content) {
			throw new AssistantError(
				"Missing content from request",
				ErrorType.PARAMS_ERROR,
			);
		}

		const embedding = Embedding.getInstance(env);

		const newMetadata = { ...metadata, title };

		const uniqueId =
			id || `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

		const database = await env.DB.prepare(
			"INSERT INTO documents (id, metadata, title, content, type) VALUES (?1, ?2, ?3, ?4, ?5)",
		).bind(uniqueId, JSON.stringify(newMetadata), title, content, type);
		const result = await database.run();

		if (!result.success) {
			throw new AssistantError("Error storing embedding in the database");
		}

		const generated = await embedding.generate(
			type,
			content,
			uniqueId,
			newMetadata,
		);
		const inserted = await embedding.insert(generated);

		// @ts-ignore
		if (!inserted.mutationId && !inserted.documentDetails) {
			throw new AssistantError("Embedding insertion failed");
		}

		return {
			status: "success",
			data: {
				id: uniqueId,
				metadata: newMetadata,
				title,
				content,
				type,
			},
		};
	} catch (error) {
		throw new AssistantError("Error inserting embedding");
	}
};
