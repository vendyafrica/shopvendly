import { pgTable, uuid, text, jsonb, timestamp, boolean, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenant-schema";

export const mediaObjects = pgTable(
    "media_objects",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        tenantId: uuid("tenant_id")
            .notNull()
            .references(() => tenants.id, { onDelete: "cascade" }),

        blobUrl: text("blob_url").notNull(),
        blobPathname: text("blob_pathname").notNull(),
        contentType: text("content_type").notNull(),

        source: text("source").notNull().default("upload"),
        sourceMediaId: text("source_media_id"),
        sourceMetadata: jsonb("source_metadata"),
        isPublic: boolean("is_public").default(true).notNull(),

        lastSyncedAt: timestamp("last_synced_at"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
    },
    (table) => [
        index("media_objects_tenant_idx").on(table.tenantId),
        index("media_objects_blob_pathname_idx").on(table.blobPathname),
        index("media_objects_source_idx").on(table.source),
    ]
);