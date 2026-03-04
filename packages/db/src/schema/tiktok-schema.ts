import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  integer,
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
    profileUrl: text("profile_url"),

    isActive: boolean("is_active").default(true).notNull(),
    lastSyncedAt: timestamp("last_synced_at"),
    lastImportedAt: timestamp("last_imported_at"),

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

export const tiktokPosts = pgTable(
  "tiktok_posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    accountId: uuid("account_id")
      .notNull()
      .references(() => tiktokAccounts.id, { onDelete: "cascade" }),
    sourcePostId: text("source_post_id").notNull(),
    title: text("title"),
    videoDescription: text("video_description"),
    duration: integer("duration"),
    coverImageUrl: text("cover_image_url"),
    embedLink: text("embed_link"),
    shareUrl: text("share_url"),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAtSource: timestamp("created_at_source"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    unique("tiktok_posts_store_source_unique").on(table.storeId, table.sourcePostId),
    index("tiktok_posts_tenant_idx").on(table.tenantId),
    index("tiktok_posts_store_idx").on(table.storeId),
    index("tiktok_posts_account_idx").on(table.accountId),
  ]
);

export const tiktokAccountsRelations = relations(tiktokAccounts, ({ one, many }) => ({
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
  posts: many(tiktokPosts),
}));

export const tiktokPostsRelations = relations(tiktokPosts, ({ one }) => ({
  tenant: one(tenants, {
    fields: [tiktokPosts.tenantId],
    references: [tenants.id],
  }),
  store: one(stores, {
    fields: [tiktokPosts.storeId],
    references: [stores.id],
  }),
  account: one(tiktokAccounts, {
    fields: [tiktokPosts.accountId],
    references: [tiktokAccounts.id],
  }),
}));

export type TikTokAccount = typeof tiktokAccounts.$inferSelect;
export type NewTikTokAccount = typeof tiktokAccounts.$inferInsert;
export type TikTokPost = typeof tiktokPosts.$inferSelect;
export type NewTikTokPost = typeof tiktokPosts.$inferInsert;
