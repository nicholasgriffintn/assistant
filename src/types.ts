import type {
	D1Database,
	VectorFloatArray,
	Vectorize,
	VectorizeAsyncMutation,
	VectorizeMatches,
	VectorizeVector,
} from "@cloudflare/workers-types";

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<
	T,
	Exclude<keyof T, Keys>
> &
	{
		[K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
	}[Keys];

export type Model =
	| "claude-3.5-sonnet"
	| "claude-3.5-haiku"
	| "claude-3-opus"
	| "llama-3.3-70b-instruct"
	| "llama-3.1-70b-instruct"
	| "llama-3.2-1b-instruct"
	| "llama-3.2-3b-instruct"
	| "hermes-2-pro-mistral-7b"
	| "grok"
	| "mistral-nemo"
	| "smollm2-1.7b-instruct"
	| "llama-3.1-sonar-small-128k-online"
	| "llama-3.1-sonar-large-128k-online"
	| "llama-3.1-sonar-huge-128k-online"
	| "flux"
	| "whisper"
	| "openchat"
	| "phi-2"
	| "sqlcoder"
	| "tinyllama"
	| "una-cybertron-7b-v2"
	| "deepseek-coder-6.7b"
	| "stable-diffusion-1.5-img2img"
	| "stable-diffusion-1.5-inpainting"
	| "stable-diffusion-xl-base-1.0"
	| "stable-diffusion-xl-lightning"
	| "pixtral-large"
	| "codestral"
	| "mistral-large"
	| "mistral-small"
	| "mistral-nemo"
	| "llava"
	| "embed-english"
	| "embed-multilingual"
	| "command"
	| "command-light"
	| "command-r"
	| "command-r-plus"
	| "titan-image-generator"
	| "titan-multimodal-embeddings"
	| "titan-text-embeddings"
	| "titan-text-express"
	| "titan-text-lite"
	| "titan-text-premier"
	| "nova-canvas"
	| "nova-lite"
	| "nova-micro"
	| "nova-pro"
	| "nova-reel"
	| "jamba-large"
	| "jamba-mini"
	| "jambda-instruct"
	| "qwq"
	| "o1-preview"
	| "o1-mini"
	| "gpt-4o"
	| "gpt-4o-mini"
	| "gpt-4-turbo"
	| "gpt-4"
	| "gpt-3.5-turbo"
	| "gemini-1.5-flash"
	| "gemini-1.5-pro"
	| "gemini-1.5-flash-8b"
	| "gemini-experimental-1121"
	| "gemini-experimental-1206"
	| "bge-large-en-v1.5";

export type ModelConfig = {
	[K in Model]: {
		matchingModel: string;
		provider: string;
		type: string | string[];
		isBeta?: boolean;
		supportsFunctions?: boolean;
	};
};

export type Platform = "web" | "mobile" | "api";

export interface IEnv {
		AI: {
			run: (model: string, options: any, config: any) => Promise<any>;
			aiGatewayLogId?: string;
		};
		VECTOR_DB: Vectorize;
		DB: D1Database;
		ASSETS_BUCKET: any;
		ACCOUNT_ID: string;
		ANTHROPIC_API_KEY?: string;
		AI_GATEWAY_TOKEN?: string;
		GROK_API_KEY?: string;
		HUGGINGFACE_TOKEN?: string;
		PERPLEXITY_API_KEY?: string;
		CHAT_HISTORY?: any;
		REPLICATE_API_TOKEN?: string;
		WEBHOOK_SECRET?: string;
		ASSETS_BUCKET_ACCESS_KEY_ID: string;
		ASSETS_BUCKET_SECRET_ACCESS_KEY: string;
		MISTRAL_API_KEY?: string;
		OPENROUTER_API_KEY?: string;
		BEDROCK_AWS_ACCESS_KEY?: string;
		BEDROCK_AWS_SECRET_KEY?: string;
		BEDROCK_GUARDRAIL_ID: string;
		BEDROCK_GUARDRAIL_VERSION?: string;
		AWS_REGION?: string;
		GUARDRAILS_ENABLED?: string;
		GUARDRAILS_PROVIDER?: string;
		OPENAI_API_KEY?: string;
		GOOGLE_STUDIO_API_KEY?: string;
		EMBEDDING_PROVIDER?: string;
		BEDROCK_KNOWLEDGE_BASE_ID?: string;
		BEDROCK_KNOWLEDGE_BASE_CUSTOM_DATA_SOURCE_ID?: string;
	}

export type ContentType = "text" | "image_url" | "audio_url";
export type ChatRole = "user" | "assistant" | "tool";
export type ChatMode = "normal" | "local" | "prompt_coach" | "no_system";

export type MessageContent = {
	type: ContentType;
	text?: string;
	image_url?: {
		url: string;
	};
	audio_url?: {
		url: string;
	};
};

export type Attachment = {
	type: "image";
	url: string;
	detail?: "low" | "high";
};

export interface Message {
	role: ChatRole;
	name?: string;
	tool_calls?: Record<string, any>[];
	parts?: {
		text: string;
	}[];
	content: string | MessageContent[];
	status?: string;
	data?: Record<string, any>;
	model?: string;
	logId?: string;
	citations?: string[];
	app?: string;
	mode?: ChatMode;
}

export type ChatInput = string | { prompt: string };

export interface IBody {
	chat_id: string;
	input: ChatInput;
	attachments?: Attachment[];
	date: string;
	location?: {
		latitude?: number;
		longitude?: number;
	};
	model?: Model;
	platform?: Platform;
	mode?: ChatMode;
	role?: ChatRole;
	[other: string]: any;
}

export interface IFeedbackBody {
	logId: string;
	feedback: string;
}

export interface IUser {
	longitude?: number;
	latitude?: number;
	email: string;
}

export type RagOptions = {
	topK?: number;
	scoreThreshold?: number;
	includeMetadata?: boolean;
};

export interface IRequest {
	appUrl?: string;
	env: IEnv;
	request?: IBody;
	user?: IUser;
	webhookUrl?: string;
	webhookEvents?: string[];
	mode?: ChatMode;
	useRAG?: boolean;
	ragOptions?: RagOptions;
}

export type IFunctionResponse = {
	status?: string;
	name?: string;
	content?: string | MessageContent[];
	data?: any;
};

export interface IFunction {
	name: string;
	appUrl?: string;
	description: string;
	parameters: {
		type: "object";
		properties: {
			[key: string]: {
				type: string;
				description: string;
				default?: any;
				minimum?: number;
				maximum?: number;
			};
		};
		required?: string[];
	};
	function: (
		chatId: string,
		params: any,
		req: IRequest,
		appUrl?: string,
	) => Promise<IFunctionResponse>;
}

export interface IWeather {
	cod: number;
	main: {
		temp: number;
		feels_like: number;
		temp_min: number;
		temp_max: number;
		pressure: number;
		humidity: number;
	};
	weather: {
		main: string;
		description: string;
	}[];
	wind: {
		speed: number;
		deg: number;
	};
	clouds: {
		all: number;
	};
	sys: {
		country: string;
	};
	name: string;
}

export type EmbeddingProvider = {
	generate: (
		type: string,
		content: string,
		id: string,
		metadata: Record<string, any>,
	) => Promise<VectorizeVector[]>;
	insert: (embeddings: VectorizeVector[]) => Promise<VectorizeAsyncMutation>;
	getQuery: (query: string) => Promise<VectorizeVector>;
	getMatches: (queryVector: VectorFloatArray) => Promise<VectorizeMatches>;
	searchSimilar(
		query: string,
		options?: RagOptions,
	): Promise<
		{
			title: string;
			content: string;
			metadata: Record<string, any>;
			score: number;
			type: string;
		}[]
	>;
};

export interface GuardrailsProvider {
	validateContent(
		content: string,
		source: "INPUT" | "OUTPUT",
	): Promise<GuardrailResult>;
}

export interface GuardrailConfig {
	bedrock: {
		guardrailId: string;
		guardrailVersion: string;
		region: string;
	};
	inputValidation: {
		maxLength: number;
	};
	outputValidation: {
		maxLength: number;
	};
}

export interface GuardrailResult {
	isValid: boolean;
	violations: string[];
	rawResponse?: any;
}

interface AIControlParams {
	// Controls the randomness of the output; higher values produce more random results.
	temperature?: number;
	// Controls the maximum number of tokens in the response.
	max_tokens?: number;
	// Adjusts the creativity of the AI's responses by controlling how many possible words it considers. Lower values make outputs more predictable; higher values allow for more varied and creative responses.
	top_p?: number;
	// Limits the AI to choose from the top 'k' most probable words. Lower values make responses more focused; higher values introduce more variety and potential surprises.
	top_k?: number;
	// Random seed for reproducibility of the generation.
	seed?: number;
	// Penalty for repeated tokens; higher values discourage repetition.
	repetition_penalty?: number;
	// Controls the frequency of the AI's responses by controlling how many words it considers. Lower values make outputs more predictable; higher values allow for more varied and creative responses.
	frequency_penalty?: number;
	// Controls the relevance of the AI's responses by controlling how many words it considers. Lower values make outputs more predictable; higher values allow for more varied and creative responses.
	presence_penalty?: number;
}

interface AIResponseParamsBase extends AIControlParams {
	chatId?: string;
	appUrl?: string;
	systemPrompt?: string;
	messages: Message[];
	message?: string;
	env: IEnv;
	model?: string;
	version?: string;
	user?: IUser;
	webhookUrl?: string;
	webhookEvents?: string[];
	mode?: ChatMode;
}

export type AIResponseParams = RequireAtLeastOne<
	AIResponseParamsBase,
	"model" | "version"
>;

export interface GetAiResponseParams extends AIResponseParamsBase {}
