import { db } from "@shopvendly/db/db";
import { categories } from "@shopvendly/db/schema";
import { eq } from "@shopvendly/db";

export const categoryRepo = {
    async findAll() {
        return db.select().from(categories);
    },

    async findBySlug(slug: string) {
        return db.query.categories.findFirst({
            where: eq(categories.slug, slug),
        });
    }
};
