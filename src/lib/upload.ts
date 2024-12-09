import type { IEnv } from "../types";

export async function uploadImageFromChat(
	modelResponse: ReadableStream | string,
	env: IEnv,
	imageKey: string,
) {
	let arrayBuffer: ArrayBuffer;

	if (modelResponse instanceof ReadableStream) {
		const reader = modelResponse.getReader();
		const chunks = [];
		let done: boolean;
		let value: any;
  
		while ((({ done, value } = await reader.read()), !done)) {
			chunks.push(value);
		}
		arrayBuffer = new Uint8Array(
			chunks.reduce((acc, chunk) => acc.concat(Array.from(chunk)), []),
		).buffer;
	} else {
		const base64Data = modelResponse.replace(/^data:image\/\w+;base64,/, "");
		const binaryString = atob(base64Data);
		const bytes = new Uint8Array(binaryString.length);
		for (let i = 0; i < binaryString.length; i++) {
			bytes[i] = binaryString.charCodeAt(i);
		}
		arrayBuffer = bytes.buffer;
	}

	const length = arrayBuffer.byteLength;

	const response = await env.ASSETS_BUCKET.put(imageKey, arrayBuffer, {
		contentType: "image/png",
		contentLength: length,
	});

	return response;
}
