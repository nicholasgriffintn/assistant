import { Hono, type Context, type Next } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { openAPISpecs } from "hono-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import { describeRoute } from "hono-openapi";
import { resolver } from "hono-openapi/zod";

import { ROUTES } from "./contstants/routes";
import apps from "./routes/apps";
import chat from "./routes/chat";
import webhooks from "./routes/webhooks";
import { AppError, handleApiError } from "./utils/errors";
import { statusResponseSchema } from "./routes/schemas";

const app = new Hono();

/**
 * Global middleware to enable CORS
 */
app.use(
	"*",
	cors({
		origin: ["http://localhost:3000", "https://nicholasgriffin.dev"],
		allowMethods: ["GET", "POST", "PUT", "DELETE"],
	}),
);

/**
 * Global middleware to log the request method and URL
 */
app.use("*", logger());

/**
 * Global middleware to rate limit requests
 */
app.use("*", async (context: Context, next: Next) => {
	if (!context.env.RATE_LIMITER) {
		throw new AppError("Missing RATE_LIMITER binding", 500);
	}

	const url = context.req.url;
	const pathname = new URL(url).pathname;

	const userEmail: string = context.req.header("x-user-email") || "anonymous";

	const key = `${userEmail}-${pathname}`;

	const result = await context.env.RATE_LIMITER.limit({ key });

	if (!result.success) {
		throw new AppError("Rate limit exceeded", 429);
	}

	return next();
});

app.get("/", swaggerUI({ url: "/openapi" }));

app.get(
	"/openapi",
	openAPISpecs(app, {
		documentation: {
			info: {
				title: "Assistant",
				version: "0.0.1",
				description:
					"A group of AI tools by Nicholas Griffin, for Nicholas Griffin",
			},
			components: {
				securitySchemes: {
					bearerAuth: {
						type: "http",
						scheme: "bearer",
						bearerFormat: "JWT",
					},
				},
			},
			security: [
				{
					bearerAuth: [],
				},
			],
			servers: [
				{
					url: "http://localhost:8787",
					description: "development",
				},
				{
					url: "https://assistant.nicholasgriffin.workers.dev",
					description: "production",
				},
			],
		},
	}),
);

app.get(
	"/status",
	describeRoute({
		description: "Check if the API is running",
		responses: {
			200: {
				description: "API is running",
				content: {
					"application/json": {
						schema: resolver(statusResponseSchema),
					},
				},
			},
		},
	}),
	(c) => c.json({ status: "ok" }),
);

/**
 * Webhooks route
 */
app.route(ROUTES.WEBHOOKS, webhooks);

/**
 * Chat route
 */
app.route(ROUTES.CHAT, chat);

/**
 * Apps route
 */
app.route(ROUTES.APPS, apps);

/**
 * Global 404 handler
 */
app.notFound((c) => c.json({ status: "not found" }, 404));

/**
 * Global error handler
 */
app.onError((err, c) => {
	return handleApiError(err);
});

export default app;
