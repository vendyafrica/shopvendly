import {
    pgTable,
    text,
    timestamp,
    uuid,
    index,
    unique,
    boolean,
} from "drizzle-orm/pg-core";

import { tenants } from "./tenant-schema";


export const stores = pgTable(
    "stores",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        tenantId: uuid("tenant_id")
            .notNull()
            .references(() => tenants.id, { onDelete: "cascade" }),

        name: text("name").notNull(),
        slug: text("slug").notNull(),
        description: text("description"),
        logoUrl: text("logo_url"),
        categories: text("categories").array().default([]),
        status: boolean("status").notNull().default(false),
        defaultCurrency: text("default_currency").default("UGX").notNull(),

        storeContactPhone: text("store_contact_phone"),
        storeContactEmail: text("store_contact_email"),
        storeAddress: text("store_address"),
        
        heroMedia: text("hero_media").array().default([]),

        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
        deletedAt: timestamp("deleted_at"),
    },
    (table) => [
        unique("stores_tenant_slug_unique").on(table.tenantId, table.slug),
        index("stores_tenant_idx").on(table.tenantId),
        index("stores_slug_idx").on(table.slug),
    ]
);

export type Store = typeof stores.$inferSelect;
export type NewStore = typeof stores.$inferInsert;
