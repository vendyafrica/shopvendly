#!/usr/bin/env tsx

import { runCollectoSettlementForOrder } from "../features/payments/services/collecto-settlement.js";

async function main() {
  const orderId = process.argv[2];

  if (!orderId) {
    console.error("Usage: pnpm tsx apps/api/scripts/run-collecto-settlement.ts <orderId>");
    process.exit(1);
  }

  try {
    const result = await runCollectoSettlementForOrder(orderId);
    console.log("[Collecto] settlement complete", { orderId, result });
    process.exit(0);
  } catch (error) {
    console.error("[Collecto] settlement failed", { orderId, error });
    process.exit(1);
  }
}

void main();
