import type { IFunction, IRequest, Message, ChatRole } from "../../types";
import { extractContent } from "../apps/content-extract";
import { getAIResponse } from "../../lib/chat";
import { extractContentSystemPrompt } from "../../lib/prompts";
export const extract_content: IFunction = {
	name: "extract_content",
	description:
		"Extract and optionally analyze content from web URLs. Can also store the content for future reference.",
	parameters: {
		type: "object",
		properties: {
			urls: {
				type: "string",
				description: "Single URL or comma-separated list of URLs to extract content from",
			},
			extract_depth: {
				type: "string",
				description: "The depth of extraction - 'basic' for main content or 'advanced' for more comprehensive extraction",
				default: "basic",
			},
			include_images: {
				type: "boolean",
				description: "Whether to include images from the content",
				default: false,
			},
			should_vectorize: {
				type: "boolean",
				description: "Whether to store the content in the vector database for future reference",
				default: false,
			},
			namespace: {
				type: "string",
				description: "Optional namespace for vector storage",
			},
		},
		required: ["urls"],
	},
	function: async (
		chatId: string,
		args: any,
		req: IRequest,
		appUrl?: string,
	) => {
		const urls = args.urls.includes(",") ? args.urls.split(",").map((u: string) => u.trim()) : args.urls;

		const result = await extractContent(
			{
				urls,
				extract_depth: args.extract_depth,
				include_images: args.include_images,
				should_vectorize: args.should_vectorize,
				namespace: args.namespace,
			},
			req,
		);

		if (result.status === "error") {
			return {
				status: "error",
				name: "extract_content",
				content: result.error || "Unknown error occurred",
				data: {},
			};
		}

		const messages: Message[] = [
			{
				role: "assistant" as ChatRole,
				content: extractContentSystemPrompt(),
			},
			{
				role: "user" as ChatRole,
				content: `Please summarize the content from the following URLs:\n\nExtracted Content:\n${result.data?.extracted.results
					.map(
						(r, i) =>
							`[${i + 1}] URL: ${r.url}\n${r.raw_content}\n`,
					)
					.join("\n\n")}`,
			},
		];

		const aiResponse = await getAIResponse({
			chatId,
			appUrl,
			user: req.user,
			env: req.env,
			messages,
			message: `Summarize content from ${typeof urls === "string" ? urls : urls.join(", ")}`,
			model: "llama-3.3-70b-versatile",
		});

		return {
			status: "success",
			name: "extract_content",
			content: aiResponse.response || "Content extracted but no summary could be generated",
			data: {
				...result.data,
				summary: aiResponse.response,
			},
		};
	},
}; 