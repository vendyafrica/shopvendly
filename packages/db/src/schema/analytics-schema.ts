import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  boolean,
  jsonb,
  index,
  unique,
} from "drizzle-orm/pg-core";

import { tenants } from "./tenant-schema";
import { stores } from "./storefront-schema";
import { users } from "./auth-schema";
import { orders } from "./order-schema";
import { products } from "./product-schema";

export const storefrontSessions = pgTable(
  "storefront_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),

    sessionId: text("session_id").notNull(),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),

    firstSeenAt: timestamp("first_seen_at").defaultNow().notNull(),
    lastSeenAt: timestamp("last_seen_at").defaultNow().notNull(),

    visitCount: integer("visit_count").default(1).notNull(),
    isReturning: boolean("is_returning").default(false).notNull(),

    referrer: text("referrer"),
    utmSource: text("utm_source"),
    utmMedium: text("utm_medium"),
    utmCampaign: text("utm_campaign"),

    deviceType: text("device_type"),
    country: text("country"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    unique("storefront_sessions_store_session_unique").on(table.storeId, table.sessionId),
    index("storefront_sessions_tenant_store_idx").on(table.tenantId, table.storeId),
    index("storefront_sessions_last_seen_idx").on(table.storeId, table.lastSeenAt),
    index("storefront_sessions_first_seen_idx").on(table.storeId, table.firstSeenAt),
  ]
);

export const storefrontEvents = pgTable(
  "storefront_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),

    eventType: text("event_type").notNull(),

    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    sessionId: text("session_id").notNull(),

    orderId: uuid("order_id").references(() => orders.id, { onDelete: "set null" }),
    productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),

    quantity: integer("quantity"),
    amount: integer("amount"),
    currency: text("currency"),

    referrer: text("referrer"),
    utmSource: text("utm_source"),
    utmMedium: text("utm_medium"),
    utmCampaign: text("utm_campaign"),

    userAgent: text("user_agent"),
    ipHash: text("ip_hash"),

    meta: jsonb("meta").default({}),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("storefront_events_tenant_store_idx").on(table.tenantId, table.storeId),
    index("storefront_events_type_idx").on(table.storeId, table.eventType),
    index("storefront_events_created_idx").on(table.storeId, table.createdAt),
    index("storefront_events_product_idx").on(table.productId),
    index("storefront_events_session_idx").on(table.storeId, table.sessionId),
  ]
);

export const storefrontSessionsRelations = relations(storefrontSessions, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [storefrontSessions.tenantId],
    references: [tenants.id],
  }),
  store: one(stores, {
    fields: [storefrontSessions.storeId],
    references: [stores.id],
  }),
  user: one(users, {
    fields: [storefrontSessions.userId],
    references: [users.id],
  }),
  events: many(storefrontEvents),
}));

export const storefrontEventsRelations = relations(storefrontEvents, ({ one }) => ({
  tenant: one(tenants, {
    fields: [storefrontEvents.tenantId],
    references: [tenants.id],
  }),
  store: one(stores, {
    fields: [storefrontEvents.storeId],
    references: [stores.id],
  }),
  user: one(users, {
    fields: [storefrontEvents.userId],
    references: [users.id],
  }),
  order: one(orders, {
    fields: [storefrontEvents.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [storefrontEvents.productId],
    references: [products.id],
  }),
}));

export type StorefrontSession = typeof storefrontSessions.$inferSelect;
export type NewStorefrontSession = typeof storefrontSessions.$inferInsert;

export type StorefrontEvent = typeof storefrontEvents.$inferSelect;
export type NewStorefrontEvent = typeof storefrontEvents.$inferInsert;
