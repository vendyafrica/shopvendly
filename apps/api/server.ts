import dotenv from "dotenv";
dotenv.config({ path: "../../.env" });

import morgan from "morgan";
import { createApp } from "./app";
import { shutdownPosthog } from "./shared/utils/posthog";

const PORT = process.env.PORT || 8000;

const app = createApp();

// Add request logging
app.use(morgan("dev"));

app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
});

const shutdown = async (signal: string) => {
  try {
    console.log(`[Shutdown] Received ${signal}. Flushing PostHog...`);
    await shutdownPosthog();
  } catch (err) {
    console.error("[Shutdown] Error during shutdown", err);
  } finally {
    process.exit(0);
  }
};

process.once("SIGINT", () => {
  void shutdown("SIGINT");
});

process.once("SIGTERM", () => {
  void shutdown("SIGTERM");
});
