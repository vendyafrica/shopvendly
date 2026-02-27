import { relations } from "drizzle-orm";
import {
    pgTable,
    text,
    timestamp,
    uuid,
    boolean,
    integer,
    jsonb,
    index,
    unique,
} from "drizzle-orm/pg-core";

import { tenants } from "./tenant-schema";
import { users } from "./auth-schema";


export const instagramAccounts = pgTable(
    "instagram_accounts",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        tenantId: uuid("tenant_id")
            .notNull()
            .references(() => tenants.id, { onDelete: "cascade" }),
        userId: text("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),

        accountId: text("account_id").notNull(),
        username: text("username"),
        accountType: text("account_type"),
        profilePictureUrl: text("profile_picture_url"),

        isActive: boolean("is_active").default(true).notNull(),
        lastSyncedAt: timestamp("last_synced_at"),

        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        unique("instagram_accounts_tenant_account_unique").on(
            table.tenantId,
            table.accountId
        ),
        index("instagram_accounts_tenant_idx").on(table.tenantId),
        index("instagram_accounts_user_idx").on(table.userId),
    ]
);

export const instagramSyncJobs = pgTable(
    "instagram_media_jobs",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        tenantId: uuid("tenant_id")
            .notNull()
            .references(() => tenants.id, { onDelete: "cascade" }),
        accountId: uuid("account_id")
            .notNull()
            .references(() => instagramAccounts.id, { onDelete: "cascade" }),

        status: text("status").notNull().default("pending"),

        mediaFetched: integer("media_fetched").default(0).notNull(),
        productsCreated: integer("products_created").default(0).notNull(),
        productsSkipped: integer("products_skipped").default(0).notNull(),

        errors: jsonb("errors"),

        startedAt: timestamp("started_at"),
        completedAt: timestamp("completed_at"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (table) => [
        index("instagram_media_jobs_tenant_idx").on(table.tenantId),
        index("instagram_media_jobs_account_idx").on(table.accountId),
        index("instagram_media_jobs_status_idx").on(table.status),
        index("instagram_media_jobs_created_idx").on(table.createdAt),
    ]
);

// Relations
export const instagramAccountsRelations = relations(
    instagramAccounts,
    ({ one, many }) => ({
        tenant: one(tenants, {
            fields: [instagramAccounts.tenantId],
            references: [tenants.id],
        }),
        user: one(users, {
            fields: [instagramAccounts.userId],
            references: [users.id],
        }),
        syncJobs: many(instagramSyncJobs),
    })
);

export const instagramSyncJobsRelations = relations(
    instagramSyncJobs,
    ({ one }) => ({
        tenant: one(tenants, {
            fields: [instagramSyncJobs.tenantId],
            references: [tenants.id],
        }),
        account: one(instagramAccounts, {
            fields: [instagramSyncJobs.accountId],
            references: [instagramAccounts.id],
        }),
    })
);

export type InstagramAccount = typeof instagramAccounts.$inferSelect;
export type NewInstagramAccount = typeof instagramAccounts.$inferInsert;

export type InstagramSyncJob = typeof instagramSyncJobs.$inferSelect;
export type NewInstagramSyncJob = typeof instagramSyncJobs.$inferInsert;
