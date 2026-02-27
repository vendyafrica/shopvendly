import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  jsonb,
  timestamp,
  uuid,
  integer,
  boolean,
  index,
  unique,
  smallint,
} from "drizzle-orm/pg-core";

import { tenants } from "./tenant-schema";
import { stores } from "./storefront-schema";
import { mediaObjects } from "./media-schema";
import { categories } from "./category-schema";
import { users } from "./auth-schema";

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),

    productName: text("product_name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),

    priceAmount: integer("price_amount").notNull().default(0),
    currency: text("currency").notNull().default("UGX"),
    quantity: integer("quantity").notNull().default(0),

    status: text("status").notNull().default("draft"),
    rating: integer("rating").default(0),
    ratingCount: integer("rating_count").default(0),

    source: text("source").notNull().default("manual"),
    sourceId: text("source_id"),
    sourceUrl: text("source_url"),

    variants: jsonb("variants").default([]),

    viewCount: integer("view_count").default(0).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [
    index("products_tenant_store_idx").on(table.tenantId, table.storeId),
    index("products_status_idx").on(table.status),
    // Composite index for filtering products by store and status (common query)
    index("products_store_status_idx").on(table.storeId, table.status),
    // Index for recently updated products
    index("products_store_updated_idx").on(table.storeId, table.updatedAt),
    unique("products_store_slug_unique").on(table.storeId, table.slug),
  ],

);

export const productRatings = pgTable(
  "product_ratings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    rating: smallint("rating").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    unique("product_ratings_product_user_unique").on(table.productId, table.userId),
    index("product_ratings_product_idx").on(table.productId),
    index("product_ratings_user_idx").on(table.userId),
  ],
);

export const productMedia = pgTable(
  "product_media",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    mediaId: uuid("media_id")
      .notNull()
      .references(() => mediaObjects.id, { onDelete: "cascade" }),

    sortOrder: integer("sort_order").default(0).notNull(),
    isFeatured: boolean("is_featured").default(false).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("product_media_product_idx").on(table.productId),
    index("product_media_media_idx").on(table.mediaId),
    index("product_media_sort_idx").on(table.productId, table.sortOrder),
  ],
);

export const productCategories = pgTable(
  "product_categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    unique("product_categories_unique").on(table.productId, table.categoryId),
    index("product_categories_product_idx").on(table.productId),
    index("product_categories_category_idx").on(table.categoryId),
  ],
);

export const productCategoriesRelations = relations(
  productCategories,
  ({ one }) => ({
    product: one(products, {
      fields: [productCategories.productId],
      references: [products.id],
    }),
    category: one(categories, {
      fields: [productCategories.categoryId],
      references: [categories.id],
    }),
  }),
);

export const mediaObjectsRelations = relations(
  mediaObjects,
  ({ one, many }) => ({
    tenant: one(tenants, {
      fields: [mediaObjects.tenantId],
      references: [tenants.id],
    }),
    productMedia: many(productMedia),
  }),
);

export const productsRelations = relations(products, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [products.tenantId],
    references: [tenants.id],
  }),
  store: one(stores, {
    fields: [products.storeId],
    references: [stores.id],
  }),
  media: many(productMedia),
  ratings: many(productRatings),
}));

export const productRatingsRelations = relations(productRatings, ({ one }) => ({
  product: one(products, {
    fields: [productRatings.productId],
    references: [products.id],
  }),
  user: one(users, {
    fields: [productRatings.userId],
    references: [users.id],
  }),
}));

export const productMediaRelations = relations(productMedia, ({ one }) => ({
  tenant: one(tenants, {
    fields: [productMedia.tenantId],
    references: [tenants.id],
  }),
  product: one(products, {
    fields: [productMedia.productId],
    references: [products.id],
  }),
  media: one(mediaObjects, {
    fields: [productMedia.mediaId],
    references: [mediaObjects.id],
  }),
}));

export type MediaObject = typeof mediaObjects.$inferSelect;
export type NewMediaObject = typeof mediaObjects.$inferInsert;

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

export type ProductMedia = typeof productMedia.$inferSelect;
export type NewProductMedia = typeof productMedia.$inferInsert;
export type ProductRating = typeof productRatings.$inferSelect;
export type NewProductRating = typeof productRatings.$inferInsert;
