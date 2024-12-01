import type { IRequest, IFunctionResponse } from '../types';
import { ChatHistory } from '../lib/history';
import { getSystemPrompt, returnCoachingPrompt } from '../lib/prompts';
import { getMatchingModel } from '../lib/models';
import { getAIResponse, handleToolCalls, processPromptCoachMode } from '../lib/chat';
import { AppError } from '../utils/errors';
export const handleCreateChat = async (req: IRequest): Promise<IFunctionResponse | IFunctionResponse[]> => {
	const { appUrl, request, env, user } = req;

	if (!request?.chat_id || !request?.input || !env.CHAT_HISTORY) {
		throw new AppError('Missing chat_id or input or chat history', 400);
	}

	const platform = request.platform || 'api';
	const model = getMatchingModel(request.model);

	if (!model) {
		throw new AppError('No matching model found', 400);
	}

	const chatHistory = ChatHistory.getInstance(env.CHAT_HISTORY, model, platform);

	if (request.mode === 'local') {
		const message = await chatHistory.add(request.chat_id, {
			role: request.role,
			content: request.input,
		});
		return [message];
	}

	await chatHistory.add(request.chat_id, {
		role: 'user',
		content: request.input,
		mode: request.mode,
	});

	const messageHistory = await chatHistory.get(request.chat_id);
	if (!messageHistory.length) {
		throw new AppError('No messages found', 400);
	}

	const { userMessage, currentMode, additionalMessages } = await processPromptCoachMode(request, chatHistory);

	const systemPrompt = currentMode === 'prompt_coach' ? await returnCoachingPrompt() : getSystemPrompt(request, model, user);
	const messages = [...additionalMessages, ...messageHistory];

	const modelResponse = await getAIResponse({
		chatId: request.chat_id,
		appUrl,
		model,
		systemPrompt,
		messages,
		message: userMessage || request.input,
		env,
		user,
		mode: currentMode,
	});

	if (modelResponse.tool_calls) {
		return await handleToolCalls(request.chat_id, modelResponse, chatHistory, req);
	}

	if (!modelResponse.response) {
		throw new AppError('No response from the model', 400);
	}

	const message = await chatHistory.add(request.chat_id, {
		role: 'assistant',
		content: modelResponse.response,
		citations: modelResponse.citations || [],
		logId: env.AI.aiGatewayLogId,
		mode: currentMode,
	});

	return [message];
};
