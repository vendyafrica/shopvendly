import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { z } from "zod";
import { and, db, eq, gt, isNull, orders, stores } from "@shopvendly/db";
import { requireAuth, requireTenantRole } from "../../../shared/middleware/auth.js";
import { collectoApiFetch } from "./collecto-http.js";
import {
  normalizeCollectoBusinessStatus,
  readCollectoMessage,
  readCollectoStatus,
} from "../services/collecto-payload.js";
import { updateCollectoCollectionState, fetchAvailableBalance, runCollectoBatchPayout } from "../services/collecto-settlement.js";
import { handlePaidOrderTransition, handleFailedOrderTransition } from "../services/payment-order-transition.js";

export const collectoReconcileRouter: ExpressRouter = Router();

const RECONCILE_WINDOW_MINUTES = 30;
const STALE_THRESHOLD_MINUTES = 10;

type ReconcileResult = {
  orderId: string;
  transactionId: string;
  previousStatus: string;
  newStatus: string;
  message: string | null;
};

/**
 * Reconcile pending mobile money orders against Collecto.
 * Callable from both the HTTP route and the scheduled interval.
 */
export async function runCollectoReconciliation(): Promise<{
  ok: boolean;
  reconciled: number;
  total: number;
  results: ReconcileResult[];
  message?: string;
}> {
  const cutoff = new Date(Date.now() - RECONCILE_WINDOW_MINUTES * 60 * 1000);

  const pendingOrders = await db.query.orders.findMany({
    where: and(
      eq(orders.paymentMethod, "mobile_money"),
      eq(orders.paymentStatus, "pending"),
      gt(orders.createdAt, cutoff),
      isNull(orders.deletedAt),
    ),
    columns: {
      id: true,
      orderNumber: true,
      collectoMeta: true,
      createdAt: true,
    },
    orderBy: (table, { asc }) => [asc(table.createdAt)],
  });

  const candidates = pendingOrders.filter((order) => {
    const txId = order.collectoMeta?.collection?.transactionId;
    return typeof txId === "string" && txId.trim() !== "" && txId !== "0" && txId !== "null";
  });

  if (candidates.length === 0) {
    return {
      ok: true,
      reconciled: 0,
      total: 0,
      results: [],
      message: "No pending mobile money orders to reconcile.",
    };
  }

  const results: ReconcileResult[] = [];

  for (const order of candidates) {
    const transactionId = order.collectoMeta!.collection!.transactionId!;

    try {
      const response = await collectoApiFetch(
        "requestToPayStatus",
        { transactionId },
        { timeoutMs: 10000 },
      );

      const payload = (response.json ?? {}) as Record<string, unknown>;
      const rawStatus = readCollectoStatus(payload);
      const normalizedStatus = normalizeCollectoBusinessStatus(rawStatus);
      const statusMessage = readCollectoMessage(payload);

      if (normalizedStatus === "successful") {
        await updateCollectoCollectionState({
          orderId: order.id,
          transactionId,
          status: "successful",
          message: statusMessage,
        });

        await handlePaidOrderTransition({
          orderId: order.id,
          paymentMethod: "mobile_money",
          includeSellerContext: true,
        });

        results.push({
          orderId: order.id,
          transactionId,
          previousStatus: "pending",
          newStatus: "successful",
          message: statusMessage,
        });
        continue;
      }

      if (normalizedStatus === "failed") {
        await updateCollectoCollectionState({
          orderId: order.id,
          transactionId,
          status: "failed",
          message: statusMessage,
        });

        await handleFailedOrderTransition({
          orderId: order.id,
          paymentMethod: "mobile_money",
        });

        results.push({
          orderId: order.id,
          transactionId,
          previousStatus: "pending",
          newStatus: "failed",
          message: statusMessage,
        });
        continue;
      }

      const ageMinutes = (Date.now() - new Date(order.createdAt).getTime()) / (60 * 1000);
      if (ageMinutes > STALE_THRESHOLD_MINUTES) {
        await updateCollectoCollectionState({
          orderId: order.id,
          transactionId,
          status: "failed",
          message: "Payment timed out — no response received from mobile money within 10 minutes.",
        });

        await handleFailedOrderTransition({
          orderId: order.id,
          paymentMethod: "mobile_money",
        });

        results.push({
          orderId: order.id,
          transactionId,
          previousStatus: "pending",
          newStatus: "timed_out",
          message: `Order is ${Math.round(ageMinutes)} minutes old with no payment confirmation.`,
        });
        continue;
      }

      results.push({
        orderId: order.id,
        transactionId,
        previousStatus: "pending",
        newStatus: "still_pending",
        message: statusMessage,
      });
    } catch (err) {
      console.error("[Collecto] reconcile:order-error", {
        orderId: order.id,
        transactionId,
        error: err,
      });

      results.push({
        orderId: order.id,
        transactionId,
        previousStatus: "pending",
        newStatus: "error",
        message: err instanceof Error ? err.message : "Unknown error during reconciliation",
      });
    }
  }

  const reconciledCount = results.filter(
    (r) => r.newStatus === "successful" || r.newStatus === "failed" || r.newStatus === "timed_out",
  ).length;

  console.info("[Collecto] reconcile:complete", {
    total: candidates.length,
    reconciled: reconciledCount,
    results,
  });

  return {
    ok: true,
    reconciled: reconciledCount,
    total: candidates.length,
    results,
  };
}

/**
 * POST /payments/collecto/reconcile
 */
collectoReconcileRouter.post("/payments/collecto/reconcile", async (_req, res, next) => {
  try {
    const result = await runCollectoReconciliation();
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /storefront/:slug/payments/collecto/reconcile-order
 *
 * Check a single order's payment status against Collecto.
 * Used by the frontend on page load to recover from a refresh mid-payment.
 */
collectoReconcileRouter.post("/storefront/:slug/payments/collecto/reconcile-order", async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { orderId, transactionId } = req.body ?? {};

    if (!orderId || !transactionId) {
      return res.status(400).json({
        error: { code: "MISSING_PARAMS", message: "orderId and transactionId are required." },
      });
    }

    // Look up the order and verify it belongs to this store
    const order = await db.query.orders.findFirst({
      where: and(
        eq(orders.id, orderId),
        eq(orders.paymentMethod, "mobile_money"),
        isNull(orders.deletedAt),
      ),
      columns: {
        id: true,
        paymentStatus: true,
        storeId: true,
        collectoMeta: true,
      },
      with: {
        store: { columns: { slug: true } },
      },
    });

    if (!order) {
      return res.status(404).json({
        error: { code: "ORDER_NOT_FOUND", message: "Order not found." },
      });
    }

    if ((order as { store?: { slug?: string } }).store?.slug !== slug) {
      return res.status(404).json({
        error: { code: "ORDER_NOT_FOUND", message: "Order not found for this store." },
      });
    }

    // If already paid or refunded, return immediately
    if (order.paymentStatus === "paid" || order.paymentStatus === "refunded") {
      return res.status(200).json({
        ok: true,
        status: order.paymentStatus === "paid" ? "successful" : order.paymentStatus,
        message: "Payment already confirmed.",
        alreadyResolved: true,
      });
    }

    // If already failed, return that
    if (order.paymentStatus === "failed") {
      return res.status(200).json({
        ok: true,
        status: "failed",
        message: "Payment was previously marked as failed.",
        alreadyResolved: true,
      });
    }

    // Check Collecto for current status
    try {
      const response = await collectoApiFetch(
        "requestToPayStatus",
        { transactionId },
        { timeoutMs: 10000 },
      );

      const payload = (response.json ?? {}) as Record<string, unknown>;
      const rawStatus = readCollectoStatus(payload);
      const normalizedStatus = normalizeCollectoBusinessStatus(rawStatus);
      const statusMessage = readCollectoMessage(payload);

      if (normalizedStatus === "successful") {
        await updateCollectoCollectionState({
          orderId,
          transactionId,
          status: "successful",
          message: statusMessage,
        });

        await handlePaidOrderTransition({
          orderId,
          paymentMethod: "mobile_money",
          includeSellerContext: true,
        });

        return res.status(200).json({
          ok: true,
          status: "successful",
          message: "Payment confirmed! Your order is now being processed.",
          alreadyResolved: false,
        });
      }

      if (normalizedStatus === "failed") {
        await updateCollectoCollectionState({
          orderId,
          transactionId,
          status: "failed",
          message: statusMessage,
        });

        await handleFailedOrderTransition({
          orderId,
          paymentMethod: "mobile_money",
        });

        return res.status(200).json({
          ok: true,
          status: "failed",
          message: statusMessage || "Payment was declined.",
          alreadyResolved: false,
        });
      }

      // Still pending — let frontend resume polling
      return res.status(200).json({
        ok: true,
        status: "pending",
        message: statusMessage || "Payment is still pending. We'll keep checking.",
        alreadyResolved: false,
      });
    } catch {
      // Collecto unreachable — let front end resume polling
      return res.status(200).json({
        ok: true,
        status: "pending",
        message: "We couldn't verify the payment status right now. We'll keep checking.",
        alreadyResolved: false,
      });
    }
  } catch (err) {
    next(err);
  }
});

const storeIdParamSchema = z.object({ storeId: z.string().uuid() });

/**
 * GET /stores/:storeId/collecto/available-balance
 *
 * Fetch the available balance for manual payout (orders with successful wallet transfer).
 * Requires authentication and owner/admin role on the tenant.
 */
collectoReconcileRouter.get(
  "/stores/:storeId/collecto/available-balance",
  requireAuth,
  requireTenantRole(["owner", "admin"]),
  async (req, res, next) => {
  try {
    const params = storeIdParamSchema.safeParse(req.params);
    if (!params.success) {
      return res.status(400).json({
        error: "Invalid storeId — must be a valid UUID",
        code: "VALIDATION_ERROR",
      });
    }

    const store = await db.query.stores.findFirst({
      where: and(eq(stores.id, params.data.storeId), isNull(stores.deletedAt)),
      columns: { id: true, tenantId: true },
    });

    if (!store || !store.tenantId) {
      return res.status(404).json({ error: "Store not found", code: "NOT_FOUND" });
    }

    const balanceResult = await fetchAvailableBalance(store.tenantId);

    return res.status(200).json({
      data: {
        walletBalance: balanceResult.walletBalance,
        bulkBalance: balanceResult.bulkBalance,
        withdrawable: balanceResult.withdrawable,
        pendingTransfer: balanceResult.pendingTransfer,
        totalOwedBalance: balanceResult.totalOwedBalance,
        availableBalance: balanceResult.bulkBalance,
        payoutAmount: balanceResult.withdrawable,
        payoutFee: 1200,
        orderCount: balanceResult.orderIds.length,
        orderIds: balanceResult.orderIds,
        pendingOrderIds: balanceResult.pendingOrderIds,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /stores/:storeId/collecto/initiate-payout
 *
 * Manually initiate batch payout for all unsettled orders.
 * Requires authentication and owner/admin role on the tenant.
 */
collectoReconcileRouter.post(
  "/stores/:storeId/collecto/initiate-payout",
  requireAuth,
  requireTenantRole(["owner", "admin"]),
  async (req, res, next) => {
    try {
      const params = storeIdParamSchema.safeParse(req.params);
      if (!params.success) {
        return res.status(400).json({
          error: "Invalid storeId — must be a valid UUID",
          code: "VALIDATION_ERROR",
        });
      }

      const store = await db.query.stores.findFirst({
        where: and(eq(stores.id, params.data.storeId), isNull(stores.deletedAt)),
        columns: { id: true, name: true, tenantId: true },
      });

      if (!store || !store.tenantId) {
        return res.status(404).json({ error: "Store not found", code: "NOT_FOUND" });
      }

      const result = await runCollectoBatchPayout(store.tenantId, store.id, store.name || "Store");

      return res.status(200).json({ data: result });
    } catch (err) {
      // Don't leak internal error messages — pass to centralized handler
      next(err);
    }
  }
);
