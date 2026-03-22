import { and, db, eq, isNull, orders, tenants, type CollectoMeta } from "@shopvendly/db";
import { orderService } from "../../orders/services/order-service.js";
import { collectoApiFetch } from "../routes/collecto-http.js";
import {
  getCollectoPayloadRecord,
  normalizeCollectoBusinessStatus,
  readCollectoBooleanFlag,
  readCollectoMessage,
  readCollectoName,
  readCollectoStatus,
  readCollectoTransactionId,
  type CollectoPayload,
} from "./collecto-payload.js";
import { trackCollectoCollection, trackCollectoSettlement } from "./collecto-observability.js";
import { COLLECTO_PAYOUT_FEE_UGX, normalizeCollectoPayoutMode } from "./collecto-pricing.js";

type CollectoStepStatus = "pending" | "successful" | "failed";

type CollectoPayoutRecipient = {
  phone: string;
  accountName: string;
};

type CollectoSettlementContext = {
  orderId: string;
  tenantId: string;
  storeId: string;
  orderNumber: string;
  grossAmount: number;
  feeAmount: number;
  existingMeta: CollectoMeta;
  settlementOrderIds: string[];
  settlementAmount: number;
  settlementLabel: string;
  payoutMode: "automatic_per_order" | "manual_batch";
};

const SETTLEMENT_STATUS_PENDING = "pending" as const;
const SETTLEMENT_STATUS_PROCESSING = "processing" as const;
const SETTLEMENT_STATUS_SUCCESSFUL = "successful" as const;
const SETTLEMENT_STATUS_FAILED = "failed" as const;

const PAYOUT_STATUS_ATTEMPTS = 8;
const STATUS_DELAY_MS = 2500;
const BULK_BALANCE_PROPAGATION_DELAY_MS = 10000;
const COLLECTO_COLLECTION_FEE_RATE = 0.03;
const COLLECTO_PAYOUT_FEE = COLLECTO_PAYOUT_FEE_UGX;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("256")) return digits;
  if (digits.startsWith("0") && digits.length === 10) return `256${digits.slice(1)}`;
  return digits;
}

function normalizeStatus(value: unknown): CollectoStepStatus {
  return normalizeCollectoBusinessStatus(value);
}

function calculateCollectoFee(amount: number) {
  return Math.round(amount * COLLECTO_COLLECTION_FEE_RATE);
}

function calculateNetSettlementAmount(amount: number) {
  return Math.max(amount - calculateCollectoFee(amount), 0);
}

function messageIndicatesSuccessfulWalletTransfer(message: string | null | undefined) {
  if (!message) return false;
  const normalized = message.toLowerCase();
  return normalized.includes("withdraw completed successfully");
}

function readNumericCandidate(payload: CollectoPayload, keys: string[]): number | null {
  const nested = getCollectoPayloadRecord(payload);
  const nestedData = nested ? getCollectoPayloadRecord(nested) : null;
  const candidates = [
    ...keys.map((key) => payload[key]),
    ...(nested ? keys.map((key) => nested[key]) : []),
    ...(nestedData ? keys.map((key) => nestedData[key]) : []),
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
    if (candidate && typeof candidate === "object" && !Array.isArray(candidate)) {
      const nestedAmount = (candidate as Record<string, unknown>).amount;
      if (typeof nestedAmount === "number" && Number.isFinite(nestedAmount)) {
        return nestedAmount;
      }
      if (typeof nestedAmount === "string") {
        const parsed = Number(nestedAmount.replace(/,/g, "").trim());
        if (Number.isFinite(parsed)) {
          return parsed;
        }
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
    pricing: patch.pricing ? { ...(existing?.pricing ?? {}), ...patch.pricing } : existing?.pricing,
    payoutPlan: patch.payoutPlan ? { ...(existing?.payoutPlan ?? {}), ...patch.payoutPlan } : existing?.payoutPlan,
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
  const nextMeta = await patchCollectoMeta(orderId, {
    ...(patch ?? {}),
    settlementStatus: SETTLEMENT_STATUS_FAILED,
    lastError: message,
  });
  const order = await orderService.getOrderById(orderId);
  if (!order) {
    return;
  }
  await trackCollectoSettlement({
    orderId: order.id,
    tenantId: order.tenantId,
    storeId: order.storeId,
    settlementBatchOrderIds: nextMeta.settlementBatchOrderIds ?? [order.id],
    settlementAmount: nextMeta.payout?.amount ?? nextMeta.walletTransfer?.amount ?? order.totalAmount,
    settlementStatus: SETTLEMENT_STATUS_FAILED,
    walletTransferReference: nextMeta.walletTransfer?.reference ?? null,
    walletTransferTransactionId: nextMeta.walletTransfer?.transactionId ?? null,
    walletTransferAmount: nextMeta.walletTransfer?.amount ?? null,
    walletTransferStatus: nextMeta.walletTransfer?.status ?? null,
    walletTransferMessage: nextMeta.walletTransfer?.message ?? null,
    payoutReference: nextMeta.payout?.reference ?? null,
    payoutTransactionId: nextMeta.payout?.transactionId ?? null,
    payoutGateway: nextMeta.payout?.gateway ?? null,
    payoutAmount: nextMeta.payout?.amount ?? null,
    payoutRecipientPhone: nextMeta.payout?.phone ?? null,
    payoutRecipientName: nextMeta.payout?.accountName ?? null,
    payoutStatus: nextMeta.payout?.status ?? null,
    payoutMessage: nextMeta.payout?.message ?? null,
    rawMetadata: {
      lastError: message,
      collectoMeta: nextMeta as unknown as Record<string, unknown>,
    },
    failedAt: new Date(),
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

  return tenantOrders.filter(
    (candidate) =>
      candidate.collectoMeta?.settlementStatus !== SETTLEMENT_STATUS_SUCCESSFUL &&
      candidate.collectoMeta?.payoutPlan?.manualPayoutCompletedAt == null
  );
}

async function pollPayoutStatus(reference: string, gateway: string, attempts: number) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const response = await collectoApiFetch("payoutStatus", { gateway, reference }, { timeoutMs: 5000 });
    const payload = (response.json ?? {}) as CollectoPayload;
    const status = normalizeStatus(readCollectoStatus(payload));
    const message = readCollectoMessage(payload);

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

async function fetchBulkBalance(requiredAmount: number) {
  const response = await collectoApiFetch("currentBalance", { type: "BULK" }, { timeoutMs: 10000 });
  const payload = (response.json ?? {}) as CollectoPayload;
  const balance = response.ok ? readBalance(payload) ?? 0 : 0;
  const message = readCollectoMessage(payload);

  console.info("[Collecto] settlement:bulk-balance:check", {
    requiredAmount,
    currentBalance: balance,
    ok: response.ok,
    sufficient: balance >= requiredAmount,
    rawResponse: JSON.stringify(response.json),
    rawText: response.text,
  });

  return {
    status: response.ok && balance >= requiredAmount ? ("successful" as const) : ("pending" as const),
    balance,
    message:
      message ??
      `Bulk balance is below the required payout amount. Available: ${balance}, required: ${requiredAmount}.`,
    payload,
  };
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
  const nested = getCollectoPayloadRecord(payload);
  const nestedData = getCollectoPayloadRecord(nested ?? {});
  const message = readCollectoMessage(payload);
  const verificationStatus = normalizeStatus(readCollectoStatus(payload));
  const verificationFlag = readCollectoBooleanFlag(payload, ["verifyPhoneNumber"]);
  const accountName =
    readCollectoName(nestedData ?? {}) || readCollectoName(nested ?? {}) || readCollectoName(payload) || null;

  if (!verification.ok || verificationStatus === "failed" || verificationFlag !== true || !accountName) {
    throw new Error(message || "Seller payout phone could not be verified.");
  }

  return {
    phone,
    accountName,
  };
}

async function getSettlementContext(orderId: string): Promise<CollectoSettlementContext | null> {
  const order = await orderService.getOrderById(orderId);
  if (!order || order.paymentMethod !== "mobile_money" || order.paymentStatus !== "paid") {
    return null;
  }

  const existingMeta = order.collectoMeta ?? {};
  const unsettledOrders = await listUnsettledSuccessfulMobileMoneyOrders(order.tenantId);
  const targetOrder = unsettledOrders.find((candidate) => candidate.id === order.id);
  const payoutMode = normalizeCollectoPayoutMode(order.store?.collectoPayoutMode ?? existingMeta.payoutPlan?.mode ?? null);
  const grossAmount = existingMeta.pricing?.customerPaidAmount ?? targetOrder?.totalAmount ?? order.totalAmount;
  const feeAmount = existingMeta.pricing?.customerPaidAmount != null
    ? Math.max(grossAmount - (existingMeta.pricing?.merchantReceivableAmount ?? 0), 0)
    : calculateCollectoFee(grossAmount);
  const settlementAmount = existingMeta.pricing?.merchantReceivableAmount ?? calculateNetSettlementAmount(grossAmount);

  return {
    orderId: order.id,
    tenantId: order.tenantId,
    storeId: order.storeId,
    orderNumber: order.orderNumber,
    grossAmount,
    feeAmount,
    existingMeta,
    settlementOrderIds: [order.id],
    settlementAmount,
    settlementLabel: order.orderNumber,
    payoutMode,
  };
}

export async function runCollectoWalletTransferForOrder(orderId: string) {
  console.info("[Collecto] settlement:wallet-transfer:triggered", { orderId });

  const context = await getSettlementContext(orderId);
  if (!context) {
    console.warn("[Collecto] settlement:wallet-transfer:skipped", {
      orderId,
      reason: "getSettlementContext returned null",
    });
    return null;
  }

  const { orderId: targetOrderId, existingMeta, settlementAmount, settlementOrderIds } = context;
  console.info("[Collecto] settlement:wallet-transfer:start", {
    orderId: targetOrderId,
    settlementOrderIds,
    settlementAmount,
  });

  await patchCollectoMeta(targetOrderId, {
    settlementStatus: SETTLEMENT_STATUS_PROCESSING,
    lastError: null,
    settlementBatchOrderIds: settlementOrderIds,
    payoutPlan: {
      mode: context.payoutMode,
      updatedAt: new Date().toISOString(),
    },
  });

  const bulkBalanceResponse = await collectoApiFetch("currentBalance", { type: "BULK" }, { timeoutMs: 10000 });
  const bulkBalancePayload = (bulkBalanceResponse.json ?? {}) as CollectoPayload;
  const bulkBalance = bulkBalanceResponse.ok ? readBalance(bulkBalancePayload) ?? 0 : 0;
  const walletTransferAmount = settlementAmount;
  const walletTransferReference = existingMeta.walletTransfer?.reference || `COLLECTO-BULK-${targetOrderId}`;

  if (walletTransferAmount <= 0) {
    await patchCollectoMeta(targetOrderId, {
      walletTransfer: {
        reference: walletTransferReference,
        amount: 0,
        status: SETTLEMENT_STATUS_SUCCESSFUL,
        message: "Bulk balance already had enough funds for payout.",
        updatedAt: new Date().toISOString(),
      },
      payoutPlan: {
        mode: context.payoutMode,
        bulkReady: true,
        manualPayoutEligible: context.payoutMode === "manual_batch",
        updatedAt: new Date().toISOString(),
      },
    });
    await trackCollectoSettlement({
      orderId: targetOrderId,
      tenantId: context.tenantId,
      storeId: context.storeId,
      settlementBatchOrderIds: settlementOrderIds,
      settlementAmount,
      settlementStatus: SETTLEMENT_STATUS_PROCESSING,
      walletTransferReference: walletTransferReference,
      walletTransferAmount: 0,
      walletTransferStatus: SETTLEMENT_STATUS_SUCCESSFUL,
      walletTransferMessage: "Bulk balance already had enough funds for payout.",
      rawMetadata: {
        stage: "wallet_transfer_skipped",
        bulkBalance,
      },
    });
    return getOrderCollectoMeta(targetOrderId);
  }

  let walletTransactionId = existingMeta.walletTransfer?.transactionId || null;
  let walletTransferStatus = existingMeta.walletTransfer?.status ?? SETTLEMENT_STATUS_PENDING;
  let walletTransferMessage = existingMeta.walletTransfer?.message ?? null;

  if (!walletTransactionId || walletTransferStatus === SETTLEMENT_STATUS_FAILED) {
    const transferResponse = await collectoApiFetch(
      "withdrawFromWallet",
      {
        amount: String(walletTransferAmount),
        reference: walletTransferReference,
        withDrawTo: "BULK",
        withdrawTo: "BULK",
      },
      { timeoutMs: 15000 },
    );
    const transferPayload = (transferResponse.json ?? {}) as CollectoPayload;
    walletTransactionId = readCollectoTransactionId(transferPayload);
    walletTransferStatus = normalizeStatus(readCollectoStatus(transferPayload));
    walletTransferMessage = readCollectoMessage(transferPayload);
    const walletTransferAccepted =
      transferResponse.ok &&
      (walletTransferStatus === SETTLEMENT_STATUS_SUCCESSFUL ||
        messageIndicatesSuccessfulWalletTransfer(walletTransferMessage) ||
        (!!walletTransactionId && walletTransferStatus !== SETTLEMENT_STATUS_FAILED));

    if (walletTransferAccepted) {
      walletTransferStatus = SETTLEMENT_STATUS_SUCCESSFUL;
    }

    await patchCollectoMeta(targetOrderId, {
      walletTransfer: {
        reference: walletTransferReference,
        transactionId: walletTransactionId,
        amount: walletTransferAmount,
        status: walletTransferStatus,
        message: walletTransferMessage,
        updatedAt: new Date().toISOString(),
      },
      payoutPlan: {
        mode: context.payoutMode,
        bulkReady: walletTransferStatus === SETTLEMENT_STATUS_SUCCESSFUL,
        manualPayoutEligible: context.payoutMode === "manual_batch" && walletTransferStatus === SETTLEMENT_STATUS_SUCCESSFUL,
        updatedAt: new Date().toISOString(),
      },
    });
    await trackCollectoSettlement({
      orderId: targetOrderId,
      tenantId: context.tenantId,
      storeId: context.storeId,
      settlementBatchOrderIds: settlementOrderIds,
      settlementAmount,
      settlementStatus: SETTLEMENT_STATUS_PROCESSING,
      walletTransferReference,
      walletTransferTransactionId: walletTransactionId,
      walletTransferAmount,
      walletTransferStatus,
      walletTransferMessage,
      rawMetadata: {
        stage: walletTransferAccepted ? "wallet_transfer_funded" : "wallet_transfer_initiated",
        response: transferPayload,
      },
    });
    console.info("[Collecto] settlement:wallet-transfer:initiate-result", {
      orderId: targetOrderId,
      settlementOrderIds,
      walletTransferReference,
      walletTransactionId,
      walletTransferStatus,
      walletTransferMessage,
    });

    if (!walletTransferAccepted) {
      await markSettlementFailed(targetOrderId, walletTransferMessage || "Collecto wallet to bulk transfer failed.");
      return null;
    }
  }

  return getOrderCollectoMeta(targetOrderId);
}

export async function runCollectoPayoutForOrder(orderId: string) {
  console.info("[Collecto] settlement:payout:triggered", { orderId });

  const context = await getSettlementContext(orderId);
  if (!context) {
    console.warn("[Collecto] settlement:payout:skipped", {
      orderId,
      reason: "getSettlementContext returned null",
    });
    return null;
  }

  const { orderId: targetOrderId, tenantId, existingMeta, settlementAmount, settlementLabel, settlementOrderIds } = context;
  console.info("[Collecto] settlement:payout:start", {
    orderId: targetOrderId,
    settlementOrderIds,
    settlementAmount,
  });

  await patchCollectoMeta(targetOrderId, {
    settlementStatus: SETTLEMENT_STATUS_PROCESSING,
    lastError: null,
    settlementBatchOrderIds: settlementOrderIds,
  });

  const recipient = await getSellerRecipient(tenantId);
  if (!recipient) {
    await markSettlementFailed(targetOrderId, "Seller phone number is missing for Collecto payout.");
    return null;
  }

  const payoutReference = existingMeta.payout?.reference || `COLLECTO-PAYOUT-${targetOrderId}`;
  const payoutGateway = existingMeta.payout?.gateway || "mobilemoney";
  const payoutAmount = Math.max(settlementAmount - COLLECTO_PAYOUT_FEE, 0);
  let payoutTransactionId = existingMeta.payout?.transactionId || null;
  let payoutStatus = existingMeta.payout?.status ?? SETTLEMENT_STATUS_PENDING;
  let payoutMessage = existingMeta.payout?.message ?? null;

  if (payoutAmount <= 0) {
    await markSettlementFailed(targetOrderId, `Payout amount after fee is zero or negative. Settlement: ${settlementAmount}, Fee: ${COLLECTO_PAYOUT_FEE}`);
    return null;
  }

  if (
    existingMeta.walletTransfer?.status === SETTLEMENT_STATUS_SUCCESSFUL &&
    (existingMeta.walletTransfer?.amount ?? 0) > 0
  ) {
    console.info("[Collecto] settlement:payout:awaiting-bulk-propagation", {
      orderId: targetOrderId,
      delayMs: BULK_BALANCE_PROPAGATION_DELAY_MS,
      walletTransferAmount: existingMeta.walletTransfer?.amount ?? 0,
    });
    await sleep(BULK_BALANCE_PROPAGATION_DELAY_MS);
  }

  const bulkBalanceResult = await fetchBulkBalance(payoutAmount);
  if (bulkBalanceResult.status !== SETTLEMENT_STATUS_SUCCESSFUL) {
    await markSettlementFailed(
      targetOrderId,
      `Bulk balance is insufficient for payout. Available: ${bulkBalanceResult.balance}, required: ${payoutAmount}.`,
      {
        payout: {
          message: bulkBalanceResult.message ?? undefined,
          updatedAt: new Date().toISOString(),
        },
      },
    );
    return null;
  }

  await trackCollectoSettlement({
    orderId: targetOrderId,
    tenantId: context.tenantId,
    storeId: context.storeId,
    settlementBatchOrderIds: settlementOrderIds,
    settlementAmount,
    settlementStatus: SETTLEMENT_STATUS_PROCESSING,
    walletTransferReference: existingMeta.walletTransfer?.reference ?? null,
    walletTransferTransactionId: existingMeta.walletTransfer?.transactionId ?? null,
    walletTransferAmount: existingMeta.walletTransfer?.amount ?? null,
    walletTransferStatus: existingMeta.walletTransfer?.status ?? null,
    walletTransferMessage: existingMeta.walletTransfer?.message ?? null,
    rawMetadata: {
      stage: "bulk_balance_checked",
      bulkBalance: bulkBalanceResult.balance,
      requiredPayoutAmount: payoutAmount,
      response: bulkBalanceResult.payload,
    },
  });

  if (!payoutTransactionId || payoutStatus === SETTLEMENT_STATUS_FAILED) {
    const payoutResponse = await collectoApiFetch(
      "initiatePayout",
      {
        gateway: payoutGateway,
        swiftCode: "",
        reference: payoutReference,
        accountName: recipient.accountName,
        accountNumber: Number(recipient.phone),
        amount: String(payoutAmount),
        message: `Shopvendly payout for ${settlementLabel}`,
        phone: Number(recipient.phone),
      },
      { timeoutMs: 15000 },
    );
    const payoutPayload = (payoutResponse.json ?? {}) as CollectoPayload;
    payoutTransactionId = readCollectoTransactionId(payoutPayload);
    payoutStatus = normalizeStatus(readCollectoStatus(payoutPayload));
    payoutMessage = readCollectoMessage(payoutPayload);

    await patchCollectoMeta(targetOrderId, {
      payout: {
        reference: payoutReference,
        transactionId: payoutTransactionId,
        gateway: payoutGateway,
        phone: recipient.phone,
        accountName: recipient.accountName,
        amount: payoutAmount,
        fee: COLLECTO_PAYOUT_FEE,
        status: payoutStatus,
        message: payoutMessage,
        updatedAt: new Date().toISOString(),
      },
    });
    await trackCollectoSettlement({
      orderId: targetOrderId,
      tenantId: context.tenantId,
      storeId: context.storeId,
      settlementBatchOrderIds: settlementOrderIds,
      settlementAmount,
      settlementStatus: SETTLEMENT_STATUS_PROCESSING,
      payoutReference,
      payoutTransactionId,
      payoutGateway,
      payoutAmount,
      payoutRecipientPhone: recipient.phone,
      payoutRecipientName: recipient.accountName,
      payoutStatus,
      payoutMessage,
      rawMetadata: {
        stage: "payout_initiated",
        response: payoutPayload,
      },
    });
    console.info("[Collecto] settlement:payout:initiate-result", {
      orderId: targetOrderId,
      settlementOrderIds,
      payoutReference,
      payoutTransactionId,
      payoutAmount,
      payoutFee: COLLECTO_PAYOUT_FEE,
      payoutStatus,
      payoutMessage,
      payoutRecipientPhone: recipient.phone,
    });

    if (!payoutResponse.ok || payoutStatus === SETTLEMENT_STATUS_FAILED) {
      await markSettlementFailed(targetOrderId, payoutMessage || "Collecto payout initiation failed.");
      return null;
    }
  }

  if (payoutStatus !== SETTLEMENT_STATUS_SUCCESSFUL) {
    const payoutStatusResult = await pollPayoutStatus(payoutReference, payoutGateway, PAYOUT_STATUS_ATTEMPTS);
    await patchCollectoMeta(targetOrderId, {
      payout: {
        reference: payoutReference,
        transactionId: payoutTransactionId,
        gateway: payoutGateway,
        phone: recipient.phone,
        accountName: recipient.accountName,
        amount: payoutAmount,
        fee: COLLECTO_PAYOUT_FEE,
        status: payoutStatusResult.status,
        message: payoutStatusResult.message,
        updatedAt: new Date().toISOString(),
      },
    });
    await trackCollectoSettlement({
      orderId: targetOrderId,
      tenantId: context.tenantId,
      storeId: context.storeId,
      settlementBatchOrderIds: settlementOrderIds,
      settlementAmount,
      settlementStatus: payoutStatusResult.status === SETTLEMENT_STATUS_SUCCESSFUL ? SETTLEMENT_STATUS_PROCESSING : SETTLEMENT_STATUS_FAILED,
      payoutReference,
      payoutTransactionId,
      payoutGateway,
      payoutAmount,
      payoutRecipientPhone: recipient.phone,
      payoutRecipientName: recipient.accountName,
      payoutStatus: payoutStatusResult.status,
      payoutMessage: payoutStatusResult.message,
      rawMetadata: {
        stage: "payout_status",
        response: payoutStatusResult.payload,
      },
    });
    console.info("[Collecto] settlement:payout:status-result", {
      orderId: targetOrderId,
      settlementOrderIds,
      payoutReference,
      payoutTransactionId,
      payoutStatus: payoutStatusResult.status,
      payoutMessage: payoutStatusResult.message,
      payoutRecipientPhone: recipient.phone,
    });

    if (payoutStatusResult.status !== SETTLEMENT_STATUS_SUCCESSFUL) {
      await markSettlementFailed(targetOrderId, payoutStatusResult.message || "Collecto payout did not complete successfully.");
      return null;
    }
  }

  const settledAtIso = new Date().toISOString();
  await patchCollectoMeta(targetOrderId, {
    settlementStatus: SETTLEMENT_STATUS_SUCCESSFUL,
    settlementBatchOrderIds: settlementOrderIds,
    settledAt: settledAtIso,
    lastError: null,
    payoutPlan: {
      mode: context.payoutMode,
      bulkReady: true,
      manualPayoutEligible: false,
      manualPayoutCompletedAt: settledAtIso,
      updatedAt: settledAtIso,
    },
  });
  const finalMeta = await getOrderCollectoMeta(targetOrderId);
  await trackCollectoSettlement({
    orderId: targetOrderId,
    tenantId: context.tenantId,
    storeId: context.storeId,
    settlementBatchOrderIds: settlementOrderIds,
    settlementAmount,
    settlementStatus: SETTLEMENT_STATUS_SUCCESSFUL,
    walletTransferReference: finalMeta.walletTransfer?.reference ?? null,
    walletTransferTransactionId: finalMeta.walletTransfer?.transactionId ?? null,
    walletTransferAmount: finalMeta.walletTransfer?.amount ?? null,
    walletTransferStatus: finalMeta.walletTransfer?.status ?? null,
    walletTransferMessage: finalMeta.walletTransfer?.message ?? null,
    payoutReference,
    payoutTransactionId,
    payoutGateway,
    payoutAmount,
    payoutRecipientPhone: recipient.phone,
    payoutRecipientName: recipient.accountName,
    payoutStatus: SETTLEMENT_STATUS_SUCCESSFUL,
    payoutMessage: finalMeta.payout?.message ?? null,
    completedAt: new Date(settledAtIso),
    rawMetadata: {
      stage: "settlement_completed",
      settledAt: settledAtIso,
      settlementOrderIds,
      grossAmount: context.grossAmount,
      feeAmount: context.feeAmount,
      netSettlementAmount: settlementAmount,
    },
  });
  console.info("[Collecto] settlement:success", {
    orderId: targetOrderId,
    settlementOrderIds,
    settlementAmount,
    payoutReference,
    payoutTransactionId,
  });

  return getOrderCollectoMeta(targetOrderId);
}

export async function fetchAvailableBalance(tenantId: string): Promise<{ availableBalance: number, totalOwedBalance: number, orderIds: string[] }> {
  const unsettledOrders = await listUnsettledSuccessfulMobileMoneyOrders(tenantId);
  const orderIds: string[] = [];
  let availableBalance = 0;
  let totalOwedBalance = 0;

  for (const order of unsettledOrders) {
    const amount = (order.collectoMeta?.walletTransfer?.amount ?? 0);
    totalOwedBalance += amount;

    if (
      order.collectoMeta?.walletTransfer?.status === "successful" &&
      order.collectoMeta?.payoutPlan?.mode === "manual_batch" &&
      order.collectoMeta?.payoutPlan?.manualPayoutEligible === true
    ) {
        availableBalance += amount;
        orderIds.push(order.id);
    }
  }
  return { availableBalance, totalOwedBalance, orderIds };
}

export async function runCollectoBatchPayout(tenantId: string, storeId: string, storeName: string) {
  const { availableBalance: balance, orderIds } = await fetchAvailableBalance(tenantId);
  const payoutAmount = balance - 1200;

  if (payoutAmount <= 0) {
      throw new Error(`Insufficient funds for withdrawal. Balance is UGX ${balance}`);
  }

  const recipient = await getSellerRecipient(tenantId);
  if (!recipient) {
      throw new Error("Seller phone number is missing for Collecto payout.");
  }

  const bulkBalanceResult = await fetchBulkBalance(payoutAmount);
  if (bulkBalanceResult.status !== SETTLEMENT_STATUS_SUCCESSFUL) {
      throw new Error(`Bulk balance not ready for payout. Available: ${bulkBalanceResult.balance}, required: ${payoutAmount}.`);
  }

  const payoutReference = `COLLECTO-BATCH-${Date.now()}`;
  const payoutGateway = "mobilemoney";

  const payoutResponse = await collectoApiFetch(
      "initiatePayout",
      {
        gateway: payoutGateway,
        swiftCode: "",
        reference: payoutReference,
        accountName: recipient.accountName,
        accountNumber: Number(recipient.phone),
        amount: String(payoutAmount),
        message: `Shopvendly batch payout for ${storeName}`,
        phone: Number(recipient.phone),
      },
      { timeoutMs: 15000 },
  );

  const payoutPayload = (payoutResponse.json ?? {}) as CollectoPayload;
  const payoutTransactionId = readCollectoTransactionId(payoutPayload);
  const payoutStatus = normalizeStatus(readCollectoStatus(payoutPayload));
  const payoutMessage = readCollectoMessage(payoutPayload);

  if (!payoutResponse.ok || payoutStatus === SETTLEMENT_STATUS_FAILED) {
      throw new Error(payoutMessage || "Collecto payout initiation failed.");
  }

  // Update all the orders participating in this batch
  for (const orderId of orderIds) {
      const orderMeta = await getOrderCollectoMeta(orderId);
      const completedAt = new Date().toISOString();
      await patchCollectoMeta(orderId, {
          settlementStatus: SETTLEMENT_STATUS_SUCCESSFUL,
          settlementBatchOrderIds: orderIds,
          settledAt: completedAt,
          payoutPlan: {
              mode: "manual_batch",
              bulkReady: true,
              manualPayoutEligible: false,
              manualPayoutTriggeredAt: orderMeta.payoutPlan?.manualPayoutTriggeredAt ?? completedAt,
              manualPayoutCompletedAt: completedAt,
              updatedAt: completedAt,
          },
          payout: {
              reference: payoutReference,
              transactionId: payoutTransactionId,
              gateway: payoutGateway,
              phone: recipient.phone,
              accountName: recipient.accountName,
              amount: orderMeta.walletTransfer?.amount ?? null,
              fee: orderIds.length > 0 ? Math.round(COLLECTO_PAYOUT_FEE / orderIds.length) : COLLECTO_PAYOUT_FEE,
              status: payoutStatus,
              message: payoutMessage,
              updatedAt: completedAt
          }
      });
  }

  return { success: true, payoutAmount, payoutStatus, payoutMessage };
}

export async function updateCollectoCollectionState(params: {
  orderId: string;
  reference?: string | null;
  transactionId?: string | null;
  status?: CollectoStepStatus;
  message?: string | null;
  payerPhone?: string | null;
  payerName?: string | null;
  rawMetadata?: Record<string, unknown> | null;
  recordedAt?: Date;
}) {
  const recordedAt = params.recordedAt ?? new Date();
  const timestamp = recordedAt.toISOString();
  await patchCollectoMeta(params.orderId, {
    collection: {
      reference: params.reference ?? undefined,
      transactionId: params.transactionId ?? undefined,
      status: params.status,
      message: params.message ?? undefined,
      updatedAt: timestamp,
    },
  });
  const order = await orderService.getOrderById(params.orderId);
  if (!order) {
    return;
  }
  await trackCollectoCollection({
    orderId: order.id,
    tenantId: order.tenantId,
    storeId: order.storeId,
    amount: order.totalAmount,
    currency: order.currency,
    providerReference: params.reference ?? null,
    providerTransactionId: params.transactionId ?? null,
    payerPhone: params.payerPhone ?? order.customerPhone ?? null,
    payerName: params.payerName ?? order.customerName ?? null,
    status: params.status,
    providerMessage: params.message ?? null,
    rawMetadata: params.rawMetadata ?? null,
    initiatedAt: params.status === "pending" ? recordedAt : null,
    confirmedAt: params.status === "successful" ? recordedAt : null,
    failedAt: params.status === "failed" ? recordedAt : null,
  });
}

export async function runCollectoSettlementForOrder(orderId: string) {
  console.info("[Collecto] settlement:triggered", { orderId });

  const context = await getSettlementContext(orderId);
  if (!context) {
    console.warn("[Collecto] settlement:skipped", {
      orderId,
      reason: "getSettlementContext returned null (order not found, not mobile_money, or not paid)",
    });
    return null;
  }

  const existingMeta = context.existingMeta ?? {};
  if (existingMeta.settlementStatus === SETTLEMENT_STATUS_SUCCESSFUL) {
    return existingMeta;
  }

  await patchCollectoMeta(context.orderId, {
    settlementStatus: SETTLEMENT_STATUS_PROCESSING,
    lastError: null,
  });
  await trackCollectoSettlement({
    orderId: context.orderId,
    tenantId: context.tenantId,
    storeId: context.storeId,
    settlementBatchOrderIds: context.settlementOrderIds,
    settlementAmount: context.settlementAmount,
    settlementStatus: SETTLEMENT_STATUS_PROCESSING,
    rawMetadata: {
      stage: "settlement_start",
      settlementOrderIds: context.settlementOrderIds,
    },
    initiatedAt: new Date(),
  });

  try {
    // Run wallet transfer and seller recipient lookup concurrently to save time.
    // Wallet transfer needs the balance check before initiating, so it runs its
    // own logic internally. Seller recipient lookup is independent (just verifies phone).
    const [walletTransferResult] = await Promise.all([
      runCollectoWalletTransferForOrder(context.orderId),
      // Warm up seller recipient early — result is used by runCollectoPayoutForOrder internally
      getSettlementContext(context.orderId),
    ]);

    if (!walletTransferResult) {
      return null;
    }

    if (context.payoutMode === "manual_batch") {
      const awaitingManualAt = new Date().toISOString();
      await patchCollectoMeta(context.orderId, {
        settlementStatus: SETTLEMENT_STATUS_PROCESSING,
        payoutPlan: {
          mode: context.payoutMode,
          bulkReady: true,
          manualPayoutEligible: true,
          updatedAt: awaitingManualAt,
        },
      });
      await trackCollectoSettlement({
        orderId: context.orderId,
        tenantId: context.tenantId,
        storeId: context.storeId,
        settlementBatchOrderIds: context.settlementOrderIds,
        settlementAmount: context.settlementAmount,
        settlementStatus: SETTLEMENT_STATUS_PROCESSING,
        walletTransferReference: walletTransferResult.walletTransfer?.reference ?? null,
        walletTransferTransactionId: walletTransferResult.walletTransfer?.transactionId ?? null,
        walletTransferAmount: walletTransferResult.walletTransfer?.amount ?? null,
        walletTransferStatus: walletTransferResult.walletTransfer?.status ?? null,
        walletTransferMessage: walletTransferResult.walletTransfer?.message ?? null,
        rawMetadata: {
          stage: "awaiting_manual_payout",
          payoutMode: context.payoutMode,
        },
      });
      return getOrderCollectoMeta(context.orderId);
    }

    return runCollectoPayoutForOrder(context.orderId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Collecto settlement failed.";
    await markSettlementFailed(context.orderId, message);
    console.error("[Collecto] settlement:error", { orderId: context.orderId, error });
    return null;
  }
}
