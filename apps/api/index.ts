import { createRequire } from "node:module";
import cors from "cors";
import express, { Express, Request, Response } from "express";
import morgan from "morgan";
import type { RawBodyRequest } from "./shared/types/raw-body.js";

const require = createRequire(import.meta.url);
const { apiRouter } = require("./routes/api-router.js") as typeof import("./routes/api-router.js");

const app: Express = express();

app.set("trust proxy", true);

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
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-With", "x-tenant-id", "x-tenant-slug"],
  })
);

app.use(
  express.json({
    verify: (req, _res, buf) => {
      (req as RawBodyRequest).rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.get("/", (_req, res) => {
  res.send("API is running");
});

app.use("/api", apiRouter);

app.use((_req, res) => {
  res.status(404).json({
    message: "Route not found",
    error: true,
  });
});

app.use((err: Error & { status?: number }, _req: Request, res: Response) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
    error: true,
  });
});

export default app;