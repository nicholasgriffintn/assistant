import type { IEnv } from "../../types";
import { AIProviderFactory } from "../../providers/factory";

export interface VideoGenerationParams {
	prompt: string;
	negative_prompt?: string;
	guidance_scale?: number;
	video_length?: number;
	height?: number;
	width?: number;
}

export interface VideoResponse {
	status: "success" | "error";
	name: string;
	content: string;
	data: any;
}

const REPLICATE_MODEL_VERSION =
	"847dfa8b01e739637fc76f480ede0c1d76408e1d694b830b5dfb8e547bf98405";

export async function generateVideo({
	chatId,
	appUrl,
	env,
	args,
}: {
	chatId: string;
	appUrl: string | undefined;
	env: IEnv;
	args: VideoGenerationParams;
}): Promise<VideoResponse> {
	try {
		if (!args.prompt) {
			return {
				status: "error",
				name: "create_video",
				content: "Missing prompt",
				data: {},
			};
		}

		const provider = AIProviderFactory.getProvider("replicate");

		const videoData = await provider.getResponse({
			chatId,
			appUrl,
			model: REPLICATE_MODEL_VERSION,
			messages: [
				{
					role: "user",
					// @ts-ignore
					content: {
						...args,
					},
				},
			],
			env: env,
		});

		return {
			status: "success",
			name: "create_video",
			content: "Video generated successfully",
			data: videoData,
		};
	} catch (error) {
		return {
			status: "error",
			name: "create_video",
			content:
				error instanceof Error ? error.message : "Failed to generate video",
			data: {},
		};
	}
}
