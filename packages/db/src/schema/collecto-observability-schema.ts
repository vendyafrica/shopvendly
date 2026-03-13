import {
    pgTable,
    text,
    timestamp,
    uuid,
    integer,
    index,
    jsonb,
} from "drizzle-orm/pg-core";

import { tenants } from "./tenant-schema";
import { stores } from "./storefront-schema";
import { orders } from "./order-schema";

export const collectoPaymentCollections = pgTable(
    "collecto_payment_collections",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        tenantId: uuid("tenant_id")
            .notNull()
            .references(() => tenants.id, { onDelete: "cascade" }),
        storeId: uuid("store_id")
            .notNull()
            .references(() => stores.id, { onDelete: "cascade" }),
        orderId: uuid("order_id")
            .notNull()
            .references(() => orders.id, { onDelete: "cascade" }),
        provider: text("provider").notNull().default("collecto"),
        providerReference: text("provider_reference"),
        providerTransactionId: text("provider_transaction_id"),
        payerPhone: text("payer_phone"),
        payerName: text("payer_name"),
        amount: integer("amount").notNull().default(0),
        currency: text("currency").notNull().default("UGX"),
        status: text("status").notNull().default("pending"),
        providerMessage: text("provider_message"),
        rawMetadata: jsonb("raw_metadata").$type<Record<string, unknown>>().notNull().default({}),
        initiatedAt: timestamp("initiated_at"),
        confirmedAt: timestamp("confirmed_at"),
        failedAt: timestamp("failed_at"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        index("collecto_payment_collections_order_idx").on(table.orderId),
        index("collecto_payment_collections_tenant_store_idx").on(table.tenantId, table.storeId),
        index("collecto_payment_collections_status_idx").on(table.status),
        index("collecto_payment_collections_created_at_idx").on(table.createdAt),
    ]
);

export const collectoSettlementAttempts = pgTable(
    "collecto_settlement_attempts",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        tenantId: uuid("tenant_id")
            .notNull()
            .references(() => tenants.id, { onDelete: "cascade" }),
        storeId: uuid("store_id")
            .notNull()
            .references(() => stores.id, { onDelete: "cascade" }),
        orderId: uuid("order_id")
            .notNull()
            .references(() => orders.id, { onDelete: "cascade" }),
        settlementBatchOrderIds: jsonb("settlement_batch_order_ids").$type<string[]>().notNull().default([]),
        settlementAmount: integer("settlement_amount").notNull().default(0),
        settlementStatus: text("settlement_status").notNull().default("pending"),
        walletTransferReference: text("wallet_transfer_reference"),
        walletTransferTransactionId: text("wallet_transfer_transaction_id"),
        walletTransferAmount: integer("wallet_transfer_amount"),
        walletTransferStatus: text("wallet_transfer_status"),
        walletTransferMessage: text("wallet_transfer_message"),
        payoutReference: text("payout_reference"),
        payoutTransactionId: text("payout_transaction_id"),
        payoutGateway: text("payout_gateway"),
        payoutAmount: integer("payout_amount"),
        payoutRecipientPhone: text("payout_recipient_phone"),
        payoutRecipientName: text("payout_recipient_name"),
        payoutStatus: text("payout_status"),
        payoutMessage: text("payout_message"),
        rawMetadata: jsonb("raw_metadata").$type<Record<string, unknown>>().notNull().default({}),
        initiatedAt: timestamp("initiated_at"),
        completedAt: timestamp("completed_at"),
        failedAt: timestamp("failed_at"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        index("collecto_settlement_attempts_order_idx").on(table.orderId),
        index("collecto_settlement_attempts_tenant_store_idx").on(table.tenantId, table.storeId),
        index("collecto_settlement_attempts_status_idx").on(table.settlementStatus),
        index("collecto_settlement_attempts_created_at_idx").on(table.createdAt),
    ]
);

export type CollectoPaymentCollection = typeof collectoPaymentCollections.$inferSelect;
export type NewCollectoPaymentCollection = typeof collectoPaymentCollections.$inferInsert;
export type CollectoSettlementAttempt = typeof collectoSettlementAttempts.$inferSelect;
export type NewCollectoSettlementAttempt = typeof collectoSettlementAttempts.$inferInsert;
