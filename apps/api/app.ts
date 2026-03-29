import express, { Request, Response, Application } from "express";
import cors from "cors";
import { apiRouter } from "./routes/api-router.js";
import { errorHandler } from "./shared/middleware/errorHandler.js";
import { apiLimiter, webhookLimiter, strictLimiter } from "./shared/middleware/rateLimiter.js";
import type { RawBodyRequest } from "./shared/types/raw-body.js";

export function createApp(): Application {
  const app = express();

  app.set("trust proxy", 1);

  app.use(
    cors({
      origin: [
        "http://localhost:3000",
        "http://localhost:4000",
        /^http:\/\/localhost:\d+$/,
        /^http:\/\/[\w-]+\.localhost:\d+$/,
        "https://vendly-web.vercel.app",
        "https://www.shopvendly.store",
        "https://shopvendly.store",
        "https://admin.shopvendly.store",
        /\.vercel\.app$/,
        /\.shopvendly\.store$/,
        /\.ngrok-free\.dev$/,
        /\.ngrok\.io$/,
      ],
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Request-With",
        "x-tenant-id",
        "x-tenant-slug",
        "x-internal-api-key",
        "Idempotency-Key",
      ],
    })
  );

  app.use(
    express.json({
      verify: (req: Request, _res: Response, buf: Buffer) => {
        (req as RawBodyRequest).rawBody = buf;
      },
    })
  );
  app.use(express.urlencoded({ extended: true }));

  // ─── Rate Limiting ────────────────────────────────────────────────────────
  // Webhook routes get a relaxed limit — Meta/Collecto/QStash can burst
  app.use("/api/webhooks", webhookLimiter);
  // Internal routes get a strict limit
  app.use("/api/internal", strictLimiter);
  // All other public API routes get the standard limit
  app.use("/api", apiLimiter);

  // ─── Utility ──────────────────────────────────────────────────────────────
  app.get("/", (_req, res) => {
    res.send("API is running");
  });

  app.get("/health", (_req, res) => {
    res.status(200).json({
      ok: true,
      service: "api",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  // ─── API Router ───────────────────────────────────────────────────────────
  app.use("/api", apiRouter);

  // ─── 404 Handler ─────────────────────────────────────────────────────────
  app.use((_req, res) => {
    res.status(404).json({
      error: "Route not found",
      code: "NOT_FOUND",
    });
  });

  // ─── Centralized Error Handler (must be last) ─────────────────────────────
  app.use(errorHandler);

  return app;
}

const app = createApp();

export default app;
