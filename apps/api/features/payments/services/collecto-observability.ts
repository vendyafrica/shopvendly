import {
  and,
  db,
  eq,
  collectoPaymentCollections,
  collectoSettlementAttempts,
} from "@shopvendly/db";

type TrackingStatus = "pending" | "successful" | "failed";

type CollectionTrackingParams = {
  orderId: string;
  tenantId: string;
  storeId: string;
  amount: number;
  currency: string;
  providerReference?: string | null;
  providerTransactionId?: string | null;
  payerPhone?: string | null;
  payerName?: string | null;
  status?: TrackingStatus;
  providerMessage?: string | null;
  rawMetadata?: Record<string, unknown> | null;
  initiatedAt?: Date | null;
  confirmedAt?: Date | null;
  failedAt?: Date | null;
};

type SettlementTrackingParams = {
  orderId: string;
  tenantId: string;
  storeId: string;
  settlementBatchOrderIds?: string[];
  settlementAmount?: number | null;
  settlementStatus?: TrackingStatus | "processing";
  walletTransferReference?: string | null;
  walletTransferTransactionId?: string | null;
  walletTransferAmount?: number | null;
  walletTransferStatus?: TrackingStatus | null;
  walletTransferMessage?: string | null;
  payoutReference?: string | null;
  payoutTransactionId?: string | null;
  payoutGateway?: string | null;
  payoutAmount?: number | null;
  payoutRecipientPhone?: string | null;
  payoutRecipientName?: string | null;
  payoutStatus?: TrackingStatus | null;
  payoutMessage?: string | null;
  rawMetadata?: Record<string, unknown> | null;
  initiatedAt?: Date | null;
  completedAt?: Date | null;
  failedAt?: Date | null;
};

async function findExistingCollectionRecord(params: {
  orderId: string;
  providerReference?: string | null;
  providerTransactionId?: string | null;
}) {
  if (params.providerTransactionId) {
    const byTransactionId = await db.query.collectoPaymentCollections.findFirst({
      where: and(
        eq(collectoPaymentCollections.orderId, params.orderId),
        eq(collectoPaymentCollections.providerTransactionId, params.providerTransactionId),
      ),
      orderBy: (table, helpers) => [helpers.desc(table.createdAt)],
    });
    if (byTransactionId) return byTransactionId;
  }

  if (params.providerReference) {
    const byReference = await db.query.collectoPaymentCollections.findFirst({
      where: and(
        eq(collectoPaymentCollections.orderId, params.orderId),
        eq(collectoPaymentCollections.providerReference, params.providerReference),
      ),
      orderBy: (table, helpers) => [helpers.desc(table.createdAt)],
    });
    if (byReference) return byReference;
  }

  return db.query.collectoPaymentCollections.findFirst({
    where: eq(collectoPaymentCollections.orderId, params.orderId),
    orderBy: (table, helpers) => [helpers.desc(table.createdAt)],
  });
}

async function findExistingSettlementRecord(orderId: string) {
  return db.query.collectoSettlementAttempts.findFirst({
    where: eq(collectoSettlementAttempts.orderId, orderId),
    orderBy: (table, helpers) => [helpers.desc(table.createdAt)],
  });
}

export async function trackCollectoCollection(params: CollectionTrackingParams) {
  const existing = await findExistingCollectionRecord({
    orderId: params.orderId,
    providerReference: params.providerReference,
    providerTransactionId: params.providerTransactionId,
  });

  const nextStatus = params.status ?? existing?.status ?? "pending";
  const nextRaw = params.rawMetadata ?? existing?.rawMetadata ?? {};

  if (existing) {
    const [updated] = await db
      .update(collectoPaymentCollections)
      .set({
        providerReference: params.providerReference ?? existing.providerReference,
        providerTransactionId: params.providerTransactionId ?? existing.providerTransactionId,
        payerPhone: params.payerPhone ?? existing.payerPhone,
        payerName: params.payerName ?? existing.payerName,
        amount: params.amount,
        currency: params.currency,
        status: nextStatus,
        providerMessage: params.providerMessage ?? existing.providerMessage,
        rawMetadata: nextRaw,
        initiatedAt: params.initiatedAt ?? existing.initiatedAt,
        confirmedAt: params.confirmedAt ?? existing.confirmedAt,
        failedAt: params.failedAt ?? existing.failedAt,
        updatedAt: new Date(),
      })
      .where(eq(collectoPaymentCollections.id, existing.id))
      .returning();

    return updated ?? existing;
  }

  const [created] = await db
    .insert(collectoPaymentCollections)
    .values({
      orderId: params.orderId,
      tenantId: params.tenantId,
      storeId: params.storeId,
      provider: "collecto",
      providerReference: params.providerReference ?? null,
      providerTransactionId: params.providerTransactionId ?? null,
      payerPhone: params.payerPhone ?? null,
      payerName: params.payerName ?? null,
      amount: params.amount,
      currency: params.currency,
      status: nextStatus,
      providerMessage: params.providerMessage ?? null,
      rawMetadata: nextRaw,
      initiatedAt: params.initiatedAt ?? null,
      confirmedAt: params.confirmedAt ?? null,
      failedAt: params.failedAt ?? null,
    })
    .returning();

  return created ?? null;
}

export async function trackCollectoSettlement(params: SettlementTrackingParams) {
  const existing = await findExistingSettlementRecord(params.orderId);
  const nextRaw = params.rawMetadata ?? existing?.rawMetadata ?? {};
  const nextStatus = params.settlementStatus ?? existing?.settlementStatus ?? "pending";

  if (existing) {
    const [updated] = await db
      .update(collectoSettlementAttempts)
      .set({
        settlementBatchOrderIds: params.settlementBatchOrderIds ?? existing.settlementBatchOrderIds,
        settlementAmount: params.settlementAmount ?? existing.settlementAmount,
        settlementStatus: nextStatus,
        walletTransferReference: params.walletTransferReference ?? existing.walletTransferReference,
        walletTransferTransactionId: params.walletTransferTransactionId ?? existing.walletTransferTransactionId,
        walletTransferAmount: params.walletTransferAmount ?? existing.walletTransferAmount,
        walletTransferStatus: params.walletTransferStatus ?? existing.walletTransferStatus,
        walletTransferMessage: params.walletTransferMessage ?? existing.walletTransferMessage,
        payoutReference: params.payoutReference ?? existing.payoutReference,
        payoutTransactionId: params.payoutTransactionId ?? existing.payoutTransactionId,
        payoutGateway: params.payoutGateway ?? existing.payoutGateway,
        payoutAmount: params.payoutAmount ?? existing.payoutAmount,
        payoutRecipientPhone: params.payoutRecipientPhone ?? existing.payoutRecipientPhone,
        payoutRecipientName: params.payoutRecipientName ?? existing.payoutRecipientName,
        payoutStatus: params.payoutStatus ?? existing.payoutStatus,
        payoutMessage: params.payoutMessage ?? existing.payoutMessage,
        rawMetadata: nextRaw,
        initiatedAt: params.initiatedAt ?? existing.initiatedAt,
        completedAt: params.completedAt ?? existing.completedAt,
        failedAt: params.failedAt ?? existing.failedAt,
        updatedAt: new Date(),
      })
      .where(eq(collectoSettlementAttempts.id, existing.id))
      .returning();

    return updated ?? existing;
  }

  const [created] = await db
    .insert(collectoSettlementAttempts)
    .values({
      orderId: params.orderId,
      tenantId: params.tenantId,
      storeId: params.storeId,
      settlementBatchOrderIds: params.settlementBatchOrderIds ?? [],
      settlementAmount: params.settlementAmount ?? 0,
      settlementStatus: nextStatus,
      walletTransferReference: params.walletTransferReference ?? null,
      walletTransferTransactionId: params.walletTransferTransactionId ?? null,
      walletTransferAmount: params.walletTransferAmount ?? null,
      walletTransferStatus: params.walletTransferStatus ?? null,
      walletTransferMessage: params.walletTransferMessage ?? null,
      payoutReference: params.payoutReference ?? null,
      payoutTransactionId: params.payoutTransactionId ?? null,
      payoutGateway: params.payoutGateway ?? null,
      payoutAmount: params.payoutAmount ?? null,
      payoutRecipientPhone: params.payoutRecipientPhone ?? null,
      payoutRecipientName: params.payoutRecipientName ?? null,
      payoutStatus: params.payoutStatus ?? null,
      payoutMessage: params.payoutMessage ?? null,
      rawMetadata: nextRaw,
      initiatedAt: params.initiatedAt ?? null,
      completedAt: params.completedAt ?? null,
      failedAt: params.failedAt ?? null,
    })
    .returning();

  return created ?? null;
}

export async function getLatestCollectionForOrder(orderId: string) {
  return db.query.collectoPaymentCollections.findFirst({
    where: eq(collectoPaymentCollections.orderId, orderId),
    orderBy: (table, helpers) => [helpers.desc(table.createdAt)],
  });
}
