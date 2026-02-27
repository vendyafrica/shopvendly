import { relations } from "drizzle-orm";
import {
    pgTable,
    text,
    timestamp,
    uuid,
    integer,
    index,
    unique,
} from "drizzle-orm/pg-core";

import { tenants } from "./tenant-schema";
import { stores } from "./storefront-schema";
import { products } from "./product-schema";

export const orders = pgTable(
    "orders",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        tenantId: uuid("tenant_id")
            .notNull()
            .references(() => tenants.id, { onDelete: "cascade" }),
        storeId: uuid("store_id")
            .notNull()
            .references(() => stores.id, { onDelete: "cascade" }),

        orderNumber: text("order_number").notNull(),

        customerName: text("customer_name").notNull(),
        customerEmail: text("customer_email").notNull(),
        customerPhone: text("customer_phone"),

        status: text("status").notNull().default("pending"),
        paymentMethod: text("payment_method").notNull().default("cash_on_delivery"),
        paymentStatus: text("payment_status").notNull().default("pending"),

        subtotal: integer("subtotal").notNull().default(0),
        totalAmount: integer("total_amount").notNull().default(0),
        currency: text("currency").notNull().default("UGX"),

        notes: text("notes"),
        deliveryAddress: text("delivery_address"),

        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
        deletedAt: timestamp("deleted_at"),
    },
    (table) => [
        index("orders_tenant_store_idx").on(table.tenantId, table.storeId),
        index("orders_status_idx").on(table.status),
        index("orders_payment_status_idx").on(table.paymentStatus),
        index("orders_created_at_idx").on(table.createdAt),
        index("orders_tenant_created_idx").on(table.tenantId, table.createdAt),
        index("orders_tenant_status_created_idx").on(table.tenantId, table.status, table.createdAt),
        unique("orders_store_number_unique").on(table.storeId, table.orderNumber),
    ]

);

export const orderItems = pgTable(
    "order_items",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        tenantId: uuid("tenant_id")
            .notNull()
            .references(() => tenants.id, { onDelete: "cascade" }),
        orderId: uuid("order_id")
            .notNull()
            .references(() => orders.id, { onDelete: "cascade" }),
        productId: uuid("product_id")
            .references(() => products.id, { onDelete: "set null" }),

        productName: text("product_name").notNull(),
        productImage: text("product_image"),

        quantity: integer("quantity").notNull().default(1),
        unitPrice: integer("unit_price").notNull(),
        totalPrice: integer("total_price").notNull(),
        currency: text("currency").notNull().default("UGX"),

        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (table) => [
        index("order_items_order_idx").on(table.orderId),
        index("order_items_product_idx").on(table.productId),
    ]
);

export const ordersRelations = relations(orders, ({ one, many }) => ({
    tenant: one(tenants, {
        fields: [orders.tenantId],
        references: [tenants.id],
    }),
    store: one(stores, {
        fields: [orders.storeId],
        references: [stores.id],
    }),
    items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
    tenant: one(tenants, {
        fields: [orderItems.tenantId],
        references: [tenants.id],
    }),
    order: one(orders, {
        fields: [orderItems.orderId],
        references: [orders.id],
    }),
    product: one(products, {
        fields: [orderItems.productId],
        references: [products.id],
    }),
}));

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;

export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;

export type OrderStatus = "pending" | "processing" | "ready" | "out_for_delivery" | "completed" | "cancelled" | "refunded";
export type PaymentMethod = "card" | "mpesa" | "mtn_momo" | "paystack" | "cash_on_delivery";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
