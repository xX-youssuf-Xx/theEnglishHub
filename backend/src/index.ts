import { createExpressMiddleware } from "@trpc/server/adapters/express";
import compression from "compression";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { authService } from "./services/auth";
import { createContext } from "./trpc/context";
import { appRouter } from "./trpc/router";
import { logger } from "./utils/logger";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const RATE_LIMIT_WINDOW_MS = Number(
	process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000,
);
const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX || 1000);

// Security middleware
app.use(helmet());
app.use(
	cors({
		origin: process.env.CORS_ORIGIN || "http://localhost:5173",
		credentials: true,
	}),
);

// Rate limiting
const limiter = rateLimit({
	windowMs: RATE_LIMIT_WINDOW_MS,
	max: RATE_LIMIT_MAX,
	message: "Too many requests from this IP, please try again later.",
});
app.use("/api/trpc", limiter);

// Body parsing and compression
app.use(express.json());
app.use(compression());

// Health check endpoint
app.get("/health", (_req, res) => {
	res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// REST endpoints for auth (needed for frontend)
app.post("/api/auth/login", async (req, res) => {
	try {
		const { username, password } = req.body;
		const result = await authService.login(username, password);
		res.json(result);
	} catch (error) {
		res.status(401).json({
			error: "Authentication failed",
			message: error instanceof Error ? error.message : "Invalid credentials",
		});
	}
});

// tRPC middleware
app.use(
	"/api/trpc",
	createExpressMiddleware({
		router: appRouter,
		createContext,
	}),
);

// Error handling middleware
app.use(
	(
		err: any,
		_req: express.Request,
		res: express.Response,
		_next: express.NextFunction,
	) => {
		logger.error("Express error:", err);
		res.status(500).json({
			error: "Internal server error",
			message: process.env.NODE_ENV === "development" ? err.message : undefined,
		});
	},
);

// 404 handler
app.use((_req, res) => {
	res.status(404).json({ error: "Not found" });
});

// Start server
app.listen(PORT, () => {
	logger.info(`Server running on port ${PORT}`);
	logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
	logger.info(`tRPC endpoint: http://localhost:${PORT}/api/trpc`);
});

export type { AppRouter } from "./trpc/router";
