"use server";

import { db, eq, categories } from "@shopvendly/db";
import { unstable_cache } from "next/cache";

const getCachedCategories = unstable_cache(
    async () => {
        return await db.select().from(categories).where(eq(categories.level, 0));
    },
    ["onboarding-categories"],
    { revalidate: 60 * 60 * 24 }
);

export async function getCategoriesAction() {
    try {
        const allCategories = process.env.NODE_ENV === "development"
            ? await db.select().from(categories).where(eq(categories.level, 0))
            : await getCachedCategories();
        return { success: true, data: allCategories };
    } catch (error) {
        console.error("Failed to fetch categories:", error);
        return { success: false, error: "Failed to fetch categories" };
    }
}
