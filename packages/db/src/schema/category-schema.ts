import { relations } from "drizzle-orm";
import {
    pgTable,
    text,
    timestamp,
    uuid,
    index,
    integer,
    foreignKey,
} from "drizzle-orm/pg-core";

export const categories = pgTable(
    "categories",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        name: text("name").notNull(),
        slug: text("slug").notNull().unique(),
        image: text("image"),
        parentId: uuid("parent_id"),
        level: integer("level").default(0).notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        index("categories_parent_idx").on(table.parentId),
        foreignKey({
            columns: [table.parentId],
            foreignColumns: [table.id],
            name: "categories_parent_id_fk",
        }).onDelete("set null"),
        index("categories_slug_idx").on(table.slug),
    ]
);

export const categoriesRelations = relations(categories, ({ one, many }) => ({
    parent: one(categories, {
        fields: [categories.parentId],
        references: [categories.id],
        relationName: "parent_child",
    }),
    children: many(categories, {
        relationName: "parent_child",
    }),
}));

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
