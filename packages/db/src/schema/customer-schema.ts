import { relations } from "drizzle-orm";
import { pgTable, uuid, text, timestamp, integer, numeric, index, jsonb } from "drizzle-orm/pg-core";
import { tenants } from "./tenant-schema";
import { stores } from "./storefront-schema";
import { users } from "./auth-schema";

export const customers = pgTable(
    "customers",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        tenantId: uuid("tenant_id")
            .notNull()
            .references(() => tenants.id, { onDelete: "cascade" }),
        storeId: uuid("store_id")
            .notNull()
            .references(() => stores.id, { onDelete: "cascade" }),

        userId: text("user_id").references(() => users.id, { onDelete: "set null" }),

        name: text("name"),
        email: text("email").notNull(),
        phone: text("phone"),

        totalOrders: integer("total_orders").default(0).notNull(),
        totalSpend: numeric("total_spend", { precision: 12, scale: 2 }).default("0").notNull(),
        lastOrderAt: timestamp("last_order_at"),

        productsViewed: jsonb("products_viewed").default([]),
        actionsLog: jsonb("actions_log").default([]),

        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        index("customers_tenant_idx").on(table.tenantId),
        index("customers_store_idx").on(table.storeId),
        index("customers_user_idx").on(table.userId),
        index("customers_email_idx").on(table.email),
    ]
);

export const superAdmins = pgTable(
    "super_admins",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: text("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        role: text("role").notNull().default("super_admin"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [index("super_admins_user_idx").on(table.userId)]
);

export const superAdminsRelations = relations(superAdmins, ({ one }) => ({
    user: one(users, {
        fields: [superAdmins.userId],
        references: [users.id],
    }),
}));

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;

export type SuperAdmin = typeof superAdmins.$inferSelect;
export type NewSuperAdmin = typeof superAdmins.$inferInsert;