import type { IRequest, IFunction, IFunctionResponse } from '../types';
import { get_weather } from '../functions/weather';
import { create_video } from '../functions/video';
import { create_music } from '../functions/music';
import { create_image } from '../functions/image';
import { AppError } from '../utils/errors';
export const availableFunctions: IFunction[] = [get_weather, create_video, create_music, create_image];

export const handleFunctions = async (
	chatId: string,
	appUrl: string | undefined,
	functionName: string,
	args: unknown,
	request: IRequest
): Promise<IFunctionResponse> => {
	const foundFunction = availableFunctions.find((func) => func.name === functionName);

	if (!foundFunction) {
		throw new AppError(`Function ${functionName} not found`, 400);
	}

	return foundFunction.function(chatId, args, request, appUrl);
};
