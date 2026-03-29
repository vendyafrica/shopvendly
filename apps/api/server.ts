import dotenv from "dotenv";
dotenv.config({ path: "../../.env" });

import morgan from "morgan";
import app from "./app.js";
import { shutdownPosthog } from "./shared/utils/posthog.js";
import { runCollectoReconciliation } from "./features/payments/routes/collecto-reconcile.js";

const PORT = process.env.PORT || 8000;
const RECONCILE_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

// Add request logging
app.use(morgan("dev"));

app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
});

// Schedule automatic payment reconciliation every 5 minutes
const reconcileInterval = setInterval(() => {
  runCollectoReconciliation().catch((err) => {
    console.error("[Collecto] scheduled-reconcile:error", err);
  });
}, RECONCILE_INTERVAL_MS);

const shutdown = async (signal: string) => {
  try {
    console.log(`[Shutdown] Received ${signal}. Cleaning up...`);
    clearInterval(reconcileInterval);
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
