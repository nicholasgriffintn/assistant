import type { IEnv } from "../../types";
import { AIProviderFactory } from "../../providers/factory";

export interface ImageGenerationParams {
	prompt: string;
	negative_prompt?: string;
	width?: number;
	height?: number;
	num_outputs?: number;
	guidance_scale?: number;
}

export interface ImageResponse {
	status: "success" | "error";
	name: string;
	content: string;
	data: any;
}

const REPLICATE_MODEL_VERSION =
	"5599ed30703defd1d160a25a63321b4dec97101d98b4674bcc56e41f62f35637";

export async function generateImage({
	chatId,
	appUrl,
	env,
	args,
}: {
	chatId: string;
	appUrl: string | undefined;
	env: IEnv;
	args: ImageGenerationParams;
}): Promise<ImageResponse> {
	if (!args.prompt) {
		return {
			status: "error",
			name: "create_image",
			content: "Missing prompt",
			data: {},
		};
	}

	try {
		const provider = AIProviderFactory.getProvider("replicate");

		const imageData = await provider.getResponse({
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
			name: "create_image",
			content: "Image generated successfully",
			data: imageData,
		};
	} catch (error) {
		return {
			status: "error",
			name: "create_image",
			content:
				error instanceof Error ? error.message : "Failed to generate image",
			data: {},
		};
	}
}
