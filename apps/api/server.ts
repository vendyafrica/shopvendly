import dotenv from "dotenv";
dotenv.config({ path: "../../.env" });

import morgan from "morgan";
import app from "./app.js";
import { shutdownPosthog } from "./shared/utils/posthog.js";

const PORT = process.env.PORT || 8000;

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
