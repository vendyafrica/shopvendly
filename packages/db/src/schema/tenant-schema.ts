import { relations } from "drizzle-orm";
import {
    pgTable,
    text,
    timestamp,
    uuid,
    index,
    unique,
    jsonb,
} from "drizzle-orm/pg-core";
import { users } from "./auth-schema";
import { onboardingStepEnum } from "../enums/onboarding";



export const tenants = pgTable(
    "tenants",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        fullName: text("full_name").notNull(),
        slug: text("slug").notNull().unique(),
        phoneNumber: text("phone_number"),
        status: text("status").notNull().default("onboarding"),
        plan: text("plan").default("free"),
        billingEmail: text("billing_email"),

        onboardingStep: onboardingStepEnum("onboarding_step").default("signup").notNull(),
        onboardingData: jsonb("onboarding_data").default({}),

        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
        deletedAt: timestamp("deleted_at"),
    },
    (table) => [index("tenants_status_idx").on(table.status)]
);

export const tenantMemberships = pgTable(
    "tenant_memberships",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        tenantId: uuid("tenant_id")
            .notNull()
            .references(() => tenants.id, { onDelete: "cascade" }),
        userId: text("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        role: text("role").notNull().default("owner"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        unique("tenant_memberships_unique").on(table.tenantId, table.userId),
        index("tenant_memberships_tenant_idx").on(table.tenantId),
        index("tenant_memberships_user_idx").on(table.userId),
    ]
);

export const tenantsRelations = relations(tenants, ({ many }) => ({
    memberships: many(tenantMemberships),
}));

export const tenantMembershipsRelations = relations(tenantMemberships, ({ one }) => ({
    tenant: one(tenants, {
        fields: [tenantMemberships.tenantId],
        references: [tenants.id],
    }),
    user: one(users, {
        fields: [tenantMemberships.userId],
        references: [users.id],
    }),
}));

export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;
export type TenantMembership = typeof tenantMemberships.$inferSelect;
export type NewTenantMembership = typeof tenantMemberships.$inferInsert;