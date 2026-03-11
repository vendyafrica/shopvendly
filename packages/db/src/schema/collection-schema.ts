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

export const storeCollections = pgTable(
  "store_collections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    image: text("image"),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    unique("store_collections_store_slug_unique").on(table.storeId, table.slug),
    unique("store_collections_store_name_unique").on(table.storeId, table.name),
    index("store_collections_store_idx").on(table.storeId),
    index("store_collections_store_sort_idx").on(table.storeId, table.sortOrder),
  ]
);

export const productCollections = pgTable(
  "product_collections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    collectionId: uuid("collection_id")
      .notNull()
      .references(() => storeCollections.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    unique("product_collections_unique").on(table.collectionId, table.productId),
    index("product_collections_collection_idx").on(table.collectionId),
    index("product_collections_product_idx").on(table.productId),
  ]
);

export const storeCollectionsRelations = relations(storeCollections, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [storeCollections.tenantId],
    references: [tenants.id],
  }),
  store: one(stores, {
    fields: [storeCollections.storeId],
    references: [stores.id],
  }),
  productLinks: many(productCollections),
}));

export const productCollectionsRelations = relations(productCollections, ({ one }) => ({
  collection: one(storeCollections, {
    fields: [productCollections.collectionId],
    references: [storeCollections.id],
  }),
  product: one(products, {
    fields: [productCollections.productId],
    references: [products.id],
  }),
}));

export type StoreCollection = typeof storeCollections.$inferSelect;
export type NewStoreCollection = typeof storeCollections.$inferInsert;
export type ProductCollection = typeof productCollections.$inferSelect;
export type NewProductCollection = typeof productCollections.$inferInsert;
