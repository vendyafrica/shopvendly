import { and, db, eq, isNull, orders, tenants, type CollectoMeta } from "@shopvendly/db";
import { orderService } from "../../orders/services/order-service.js";
import { collectoApiFetch } from "../routes/collecto-http.js";

type CollectoStepStatus = "pending" | "successful" | "failed";

type CollectoPayload = Record<string, unknown>;

type CollectoPayoutRecipient = {
  phone: string;
  accountName: string;
};

const SETTLEMENT_STATUS_PENDING = "pending" as const;
const SETTLEMENT_STATUS_PROCESSING = "processing" as const;
const SETTLEMENT_STATUS_SUCCESSFUL = "successful" as const;
const SETTLEMENT_STATUS_FAILED = "failed" as const;

const WITHDRAW_STATUS_ATTEMPTS = 12;
const PAYOUT_STATUS_ATTEMPTS = 12;
const STATUS_DELAY_MS = 5000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("256")) return digits;
  if (digits.startsWith("0") && digits.length === 10) return `256${digits.slice(1)}`;
  return digits;
}

function getPayloadRecord(payload: CollectoPayload) {
  const nested = payload.data;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    return nested as CollectoPayload;
  }

  return null;
}

function readStringCandidate(payload: CollectoPayload, keys: string[]): string | null {
  const nested = getPayloadRecord(payload);
  const candidates = [
    ...keys.map((key) => payload[key]),
    ...(nested ? keys.map((key) => nested[key]) : []),
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      return String(candidate);
    }
  }

  return null;
}

function readMessage(payload: CollectoPayload) {
  return readStringCandidate(payload, ["message", "status_message", "responseMessage", "description"]);
}

function readStatus(payload: CollectoPayload): unknown {
  const nested = getPayloadRecord(payload);
  return (
    nested?.status ??
    nested?.paymentStatus ??
    nested?.transactionStatus ??
    nested?.state ??
    payload.status ??
    payload.paymentStatus ??
    payload.transactionStatus ??
    payload.state ??
    nested?.message ??
    payload.message
  );
}

function normalizeStatus(value: unknown): CollectoStepStatus {
  if (typeof value !== "string") return "pending";
  const normalized = value.trim().toLowerCase();
  if (["success", "successful", "completed", "paid"].includes(normalized)) return "successful";
  if (
    ["failed", "error", "cancelled", "canceled", "rejected", "declined", "deny", "denied", "expired"].includes(normalized)
  ) {
    return "failed";
  }
  if (
    normalized.includes("declin") ||
    normalized.includes("reject") ||
    normalized.includes("cancel") ||
    normalized.includes("deni") ||
    normalized.includes("invalid") ||
    normalized.includes("insufficient") ||
    normalized.includes("not enough") ||
    normalized.includes("not found")
  ) {
    return "failed";
  }
  return "pending";
}

function readTransactionId(payload: CollectoPayload) {
  return readStringCandidate(payload, ["transactionId", "transactionID", "transaction_id", "id"]);
}

function readName(payload: CollectoPayload) {
  return readStringCandidate(payload, ["name", "registeredName", "accountName", "customerName", "fullName"]);
}

function readNumericCandidate(payload: CollectoPayload, keys: string[]): number | null {
  const nested = getPayloadRecord(payload);
  const candidates = [
    ...keys.map((key) => payload[key]),
    ...(nested ? keys.map((key) => nested[key]) : []),
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      return candidate;
    }
    if (typeof candidate === "string") {
      const parsed = Number(candidate.replace(/,/g, "").trim());
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

function readBalance(payload: CollectoPayload) {
  return readNumericCandidate(payload, ["balance", "currentBalance", "availableBalance", "amount"]);
}

function mergeCollectoMeta(existing: CollectoMeta | null | undefined, patch: Partial<CollectoMeta>): CollectoMeta {
  return {
    ...(existing ?? {}),
    ...patch,
    collection: patch.collection ? { ...(existing?.collection ?? {}), ...patch.collection } : existing?.collection,
    walletTransfer: patch.walletTransfer
      ? { ...(existing?.walletTransfer ?? {}), ...patch.walletTransfer }
      : existing?.walletTransfer,
    payout: patch.payout ? { ...(existing?.payout ?? {}), ...patch.payout } : existing?.payout,
  };
}

async function getOrderCollectoMeta(orderId: string) {
  const order = await db.query.orders.findFirst({
    where: and(eq(orders.id, orderId), isNull(orders.deletedAt)),
    columns: { id: true, collectoMeta: true },
  });

  return order?.collectoMeta ?? {};
}

async function patchCollectoMeta(orderId: string, patch: Partial<CollectoMeta>) {
  const currentMeta = await getOrderCollectoMeta(orderId);
  const nextMeta = mergeCollectoMeta(currentMeta, patch);
  await db.update(orders).set({ collectoMeta: nextMeta, updatedAt: new Date() }).where(and(eq(orders.id, orderId), isNull(orders.deletedAt)));
  return nextMeta;
}

async function markSettlementFailed(orderId: string, message: string, patch?: Partial<CollectoMeta>) {
  await patchCollectoMeta(orderId, {
    ...(patch ?? {}),
    settlementStatus: SETTLEMENT_STATUS_FAILED,
    lastError: message,
  });
}

async function listUnsettledSuccessfulMobileMoneyOrders(tenantId: string) {
  const tenantOrders = await db.query.orders.findMany({
    where: and(
      eq(orders.tenantId, tenantId),
      eq(orders.paymentMethod, "mobile_money"),
      eq(orders.paymentStatus, "paid"),
      isNull(orders.deletedAt),
    ),
    columns: {
      id: true,
      orderNumber: true,
      totalAmount: true,
      collectoMeta: true,
    },
    orderBy: (table, { asc }) => [asc(table.createdAt)],
  });

  return tenantOrders.filter((candidate) => candidate.collectoMeta?.settlementStatus !== SETTLEMENT_STATUS_SUCCESSFUL);
}

async function markSettlementBatchSuccessful(orderIds: string[], settledAtIso: string) {
  await Promise.all(
    orderIds.map(async (id) => {
      const currentMeta = await getOrderCollectoMeta(id);
      const batchIds = Array.from(new Set([...(currentMeta.settlementBatchOrderIds ?? []), ...orderIds]));

      await patchCollectoMeta(id, {
        settlementStatus: SETTLEMENT_STATUS_SUCCESSFUL,
        settlementBatchOrderIds: batchIds,
        settledAt: settledAtIso,
        lastError: null,
      });
    }),
  );
}

async function pollTransactionStatus(method: string, transactionId: string, attempts: number) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const response = await collectoApiFetch(method, { transactionId }, { timeoutMs: 5000 });
    const payload = (response.json ?? {}) as CollectoPayload;
    const status = normalizeStatus(readStatus(payload));
    const message = readMessage(payload);

    if (!response.ok || status === "failed") {
      return { status: "failed" as const, message, payload };
    }

    if (status === "successful") {
      return { status: "successful" as const, message, payload };
    }

    if (attempt < attempts) {
      await sleep(STATUS_DELAY_MS);
    }
  }

  return { status: "pending" as const, message: "Collecto status is still pending.", payload: {} as CollectoPayload };
}

async function pollPayoutStatus(reference: string, gateway: string, attempts: number) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const response = await collectoApiFetch("payoutStatus", { gateway, reference }, { timeoutMs: 5000 });
    const payload = (response.json ?? {}) as CollectoPayload;
    const status = normalizeStatus(readStatus(payload));
    const message = readMessage(payload);

    if (!response.ok || status === "failed") {
      return { status: "failed" as const, message, payload };
    }

    if (status === "successful") {
      return { status: "successful" as const, message, payload };
    }

    if (attempt < attempts) {
      await sleep(STATUS_DELAY_MS);
    }
  }

  return { status: "pending" as const, message: "Collecto payout is still pending.", payload: {} as CollectoPayload };
}

async function getSellerRecipient(tenantId: string): Promise<CollectoPayoutRecipient | null> {
  const tenant = await db.query.tenants.findFirst({
    where: and(eq(tenants.id, tenantId), isNull(tenants.deletedAt)),
    columns: { fullName: true, phoneNumber: true },
  });

  if (!tenant?.phoneNumber) {
    return null;
  }

  const phone = normalizePhone(tenant.phoneNumber);
  const verification = await collectoApiFetch("verifyPhoneNumber", { phone }, { timeoutMs: 4000 });
  const payload = (verification.json ?? {}) as CollectoPayload;
  const message = readMessage(payload);
  const verificationStatus = normalizeStatus(readStatus(payload));

  if (!verification.ok || verificationStatus === "failed") {
    throw new Error(message || "Seller payout phone could not be verified.");
  }

  return {
    phone,
    accountName: readName(payload) || tenant.fullName,
  };
}

export async function updateCollectoCollectionState(params: {
  orderId: string;
  reference?: string | null;
  transactionId?: string | null;
  status?: CollectoStepStatus;
  message?: string | null;
}) {
  const timestamp = new Date().toISOString();
  await patchCollectoMeta(params.orderId, {
    collection: {
      reference: params.reference ?? undefined,
      transactionId: params.transactionId ?? undefined,
      status: params.status,
      message: params.message ?? undefined,
      updatedAt: timestamp,
    },
  });
}

export async function runCollectoSettlementForOrder(orderId: string) {
  const order = await orderService.getOrderById(orderId);
  if (!order || order.paymentMethod !== "mobile_money" || order.paymentStatus !== "paid") {
    return null;
  }

  const existingMeta = order.collectoMeta ?? {};
  if (existingMeta.settlementStatus === SETTLEMENT_STATUS_SUCCESSFUL) {
    return existingMeta;
  }

  await patchCollectoMeta(order.id, {
    settlementStatus: SETTLEMENT_STATUS_PROCESSING,
    lastError: null,
  });

  try {
    const recipient = await getSellerRecipient(order.tenantId);
    if (!recipient) {
      await markSettlementFailed(order.id, "Seller phone number is missing for Collecto payout.");
      return null;
    }

    const unsettledOrders = await listUnsettledSuccessfulMobileMoneyOrders(order.tenantId);
    if (!unsettledOrders.some((candidate) => candidate.id === order.id)) {
      return getOrderCollectoMeta(order.id);
    }

    const settlementOrderIds = unsettledOrders.map((candidate) => candidate.id);
    const settlementAmount = unsettledOrders.reduce((sum, candidate) => sum + candidate.totalAmount, 0);
    const settlementLabel =
      unsettledOrders.length === 1
        ? unsettledOrders[0]?.orderNumber || order.orderNumber
        : `${unsettledOrders.length} mobile money orders`;

    const bulkBalanceResponse = await collectoApiFetch("currentBalance", { type: "BULK" }, { timeoutMs: 5000 });
    const bulkBalancePayload = (bulkBalanceResponse.json ?? {}) as CollectoPayload;
    const bulkBalance = bulkBalanceResponse.ok ? readBalance(bulkBalancePayload) ?? 0 : 0;
    const walletTransferAmount = Math.max(settlementAmount - bulkBalance, 0);
    const walletTransferReference = existingMeta.walletTransfer?.reference || `COLLECTO-BULK-${order.id}`;

    await patchCollectoMeta(order.id, {
      settlementBatchOrderIds: settlementOrderIds,
    });

    if (walletTransferAmount > 0) {
      let walletTransactionId = existingMeta.walletTransfer?.transactionId || null;
      let walletTransferStatus = existingMeta.walletTransfer?.status ?? SETTLEMENT_STATUS_PENDING;
      let walletTransferMessage = existingMeta.walletTransfer?.message ?? null;

      if (!walletTransactionId || walletTransferStatus === SETTLEMENT_STATUS_FAILED) {
        const transferResponse = await collectoApiFetch(
          "withdrawFromWallet",
          { amount: String(walletTransferAmount), reference: walletTransferReference, withDrawTo: "mobilemoney" },
          { timeoutMs: 8000 },
        );
        const transferPayload = (transferResponse.json ?? {}) as CollectoPayload;
        walletTransactionId = readTransactionId(transferPayload);
        walletTransferStatus = normalizeStatus(readStatus(transferPayload));
        walletTransferMessage = readMessage(transferPayload);

        await patchCollectoMeta(order.id, {
          walletTransfer: {
            reference: walletTransferReference,
            transactionId: walletTransactionId,
            amount: walletTransferAmount,
            status: walletTransferStatus,
            message: walletTransferMessage,
            updatedAt: new Date().toISOString(),
          },
        });

        if (!transferResponse.ok || !walletTransactionId || walletTransferStatus === SETTLEMENT_STATUS_FAILED) {
          await markSettlementFailed(order.id, walletTransferMessage || "Collecto wallet to bulk transfer failed.");
          return null;
        }
      }

      if (walletTransferStatus !== SETTLEMENT_STATUS_SUCCESSFUL) {
        if (!walletTransactionId) {
          await markSettlementFailed(order.id, "Collecto wallet transfer did not return a transaction ID.");
          return null;
        }

        const transferStatusResult = await pollTransactionStatus(
          "withdrawFromWalletStatus",
          walletTransactionId,
          WITHDRAW_STATUS_ATTEMPTS,
        );

        await patchCollectoMeta(order.id, {
          walletTransfer: {
            reference: walletTransferReference,
            transactionId: walletTransactionId,
            amount: walletTransferAmount,
            status: transferStatusResult.status,
            message: transferStatusResult.message,
            updatedAt: new Date().toISOString(),
          },
        });

        if (transferStatusResult.status !== SETTLEMENT_STATUS_SUCCESSFUL) {
          await markSettlementFailed(order.id, transferStatusResult.message || "Collecto wallet transfer did not complete successfully.");
          return null;
        }
      }
    } else {
      await patchCollectoMeta(order.id, {
        walletTransfer: {
          reference: walletTransferReference,
          amount: 0,
          status: SETTLEMENT_STATUS_SUCCESSFUL,
          message: "Bulk balance already had enough funds for payout.",
          updatedAt: new Date().toISOString(),
        },
      });
    }

    const payoutReference = existingMeta.payout?.reference || `COLLECTO-PAYOUT-${order.id}`;
    const payoutGateway = existingMeta.payout?.gateway || "mobilemoney";
    let payoutTransactionId = existingMeta.payout?.transactionId || null;
    let payoutStatus = existingMeta.payout?.status ?? SETTLEMENT_STATUS_PENDING;
    let payoutMessage = existingMeta.payout?.message ?? null;

    if (!payoutTransactionId || payoutStatus === SETTLEMENT_STATUS_FAILED) {
      const payoutResponse = await collectoApiFetch(
        "initiatePayout",
        {
          gateway: payoutGateway,
          swiftCode: "",
          reference: payoutReference,
          accountName: recipient.accountName,
          accountNumber: Number(recipient.phone),
          amount: String(settlementAmount),
          message: `Shopvendly payout for ${settlementLabel}`,
          phone: Number(recipient.phone),
        },
        { timeoutMs: 8000 },
      );
      const payoutPayload = (payoutResponse.json ?? {}) as CollectoPayload;
      payoutTransactionId = readTransactionId(payoutPayload);
      payoutStatus = normalizeStatus(readStatus(payoutPayload));
      payoutMessage = readMessage(payoutPayload);

      await patchCollectoMeta(order.id, {
        payout: {
          reference: payoutReference,
          transactionId: payoutTransactionId,
          gateway: payoutGateway,
          phone: recipient.phone,
          accountName: recipient.accountName,
          amount: settlementAmount,
          status: payoutStatus,
          message: payoutMessage,
          updatedAt: new Date().toISOString(),
        },
      });

      if (!payoutResponse.ok || payoutStatus === SETTLEMENT_STATUS_FAILED) {
        await markSettlementFailed(order.id, payoutMessage || "Collecto payout initiation failed.");
        return null;
      }
    }

    if (payoutStatus !== SETTLEMENT_STATUS_SUCCESSFUL) {
      const payoutStatusResult = await pollPayoutStatus(payoutReference, payoutGateway, PAYOUT_STATUS_ATTEMPTS);
      await patchCollectoMeta(order.id, {
        payout: {
          reference: payoutReference,
          transactionId: payoutTransactionId,
          gateway: payoutGateway,
          phone: recipient.phone,
          accountName: recipient.accountName,
          amount: settlementAmount,
          status: payoutStatusResult.status,
          message: payoutStatusResult.message,
          updatedAt: new Date().toISOString(),
        },
      });

      if (payoutStatusResult.status !== SETTLEMENT_STATUS_SUCCESSFUL) {
        await markSettlementFailed(order.id, payoutStatusResult.message || "Collecto payout did not complete successfully.");
        return null;
      }
    }

    const settledAtIso = new Date().toISOString();
    await markSettlementBatchSuccessful(settlementOrderIds, settledAtIso);

    return getOrderCollectoMeta(order.id);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Collecto settlement failed.";
    await markSettlementFailed(order.id, message);
    console.error("[Collecto] settlement:error", { orderId: order.id, error });
    return null;
  }
}
