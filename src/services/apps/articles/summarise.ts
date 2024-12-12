import type { IEnv, ChatRole } from '../../../types';
import { AIProviderFactory } from '../../../providers/factory';
import { summariseArticlePrompt } from '../../../lib/prompts';

export interface Params {
	article: string;
}

export interface Response {
	status: 'success' | 'error';
	name: string;
	content: string;
	data: any;
}

export async function summariseArticle({
	chatId,
	appUrl,
	env,
	args,
}: {
	chatId: string;
	appUrl: string | undefined;
	env: IEnv;
	args: Params;
}): Promise<Response> {
	if (!args.article) {
		return {
			status: 'error',
			name: 'summarise_article',
			content: 'Missing article',
			data: {},
		};
	}

	try {
		const provider = AIProviderFactory.getProvider('groq');

		const data = await provider.getResponse({
			chatId,
			appUrl,
			model: 'llama-3.3-70b-specdec',
			messages: [
				{
					role: 'system' as ChatRole,
					content: summariseArticlePrompt(args.article),
				},
			],
			env: env,
		});

		return {
			status: 'success',
			name: 'summarise_article',
			content: data.content,
			data,
		};
	} catch (error) {
		return {
			status: 'error',
			name: 'summarise_article',
			content: error instanceof Error ? error.message : 'Failed to summarise article',
			data: {},
		};
	}
}