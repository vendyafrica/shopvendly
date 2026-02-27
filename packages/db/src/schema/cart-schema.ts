import { relations } from "drizzle-orm";
import { pgTable, uuid, text, timestamp, integer, unique, index } from "drizzle-orm/pg-core";
import { users } from "./auth-schema";
import { products } from "./product-schema";
import { stores } from "./storefront-schema";

export const carts = pgTable(
    "carts",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [index("cart_user_idx").on(table.userId)]
);

export const cartItems = pgTable(
    "cart_items",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        cartId: uuid("cart_id").notNull().references(() => carts.id, { onDelete: "cascade" }),
        productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
        storeId: uuid("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
        quantity: integer("quantity").notNull().default(1),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        index("cart_item_cart_idx").on(table.cartId),
        unique("cart_item_unique").on(table.cartId, table.productId),
    ]
);

export const cartsRelations = relations(carts, ({ one, many }) => ({
    user: one(users, {
        fields: [carts.userId],
        references: [users.id],
    }),
    items: many(cartItems),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
    cart: one(carts, {
        fields: [cartItems.cartId],
        references: [carts.id],
    }),
    product: one(products, {
        fields: [cartItems.productId],
        references: [products.id],
    }),
    store: one(stores, {
        fields: [cartItems.storeId],
        references: [stores.id],
    }),
}));
