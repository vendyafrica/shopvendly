import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  index,
  unique,
} from "drizzle-orm/pg-core";

import { tenants } from "./tenant-schema";
import { users } from "./auth-schema";
import { stores } from "./storefront-schema";

export const tiktokAccounts = pgTable(
  "tiktok_accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    providerAccountId: text("provider_account_id").notNull(),
    displayName: text("display_name"),
    username: text("username"),
    avatarUrl: text("avatar_url"),

    isActive: boolean("is_active").default(true).notNull(),
    lastSyncedAt: timestamp("last_synced_at"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    unique("tiktok_accounts_store_unique").on(table.storeId),
    index("tiktok_accounts_tenant_idx").on(table.tenantId),
    index("tiktok_accounts_store_idx").on(table.storeId),
    index("tiktok_accounts_user_idx").on(table.userId),
  ]
);

export const tiktokAccountsRelations = relations(tiktokAccounts, ({ one }) => ({
  tenant: one(tenants, {
    fields: [tiktokAccounts.tenantId],
    references: [tenants.id],
  }),
  store: one(stores, {
    fields: [tiktokAccounts.storeId],
    references: [stores.id],
  }),
  user: one(users, {
    fields: [tiktokAccounts.userId],
    references: [users.id],
  }),
}));

export type TikTokAccount = typeof tiktokAccounts.$inferSelect;
export type NewTikTokAccount = typeof tiktokAccounts.$inferInsert;
