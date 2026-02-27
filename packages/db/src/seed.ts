import { db } from "./db";
import { categories } from "./schema/category-schema";
import { eq } from "drizzle-orm";

const CATEGORY_DATA = [
    {
        name: "Women",
        slug: "women",
        image: "https://cdn.cosmos.so/d48eee2c-5cfa-4bb9-a35d-ec78717c2c7e?format=jpeg",
        level: 0,
    },
    {
        name: "Men",
        slug: "men",
        image: "https://cdn.cosmos.so/25e7ef9d-3d95-486d-b7db-f0d19c1992d7?format=jpeg",
        level: 0,
    },
    {
        name: "Food & Drinks",
        slug: "food-and-drinks",
        image: "https://cdn.cosmos.so/562b5773-17ce-4e9b-9f6b-b7b652e0a6b0?format=jpeg",
        level: 0,
    },
    {
        name: "Accessories",
        slug: "accessories",
        image: "https://cdn.cosmos.so/23dcbd2e-147b-4387-8c4e-aa2bbcf22704?format=jpeg",
        level: 0,
    },
    {
        name: "Beauty & Personal Care",
        slug: "beauty-and-personal-care",
        image: "https://cdn.cosmos.so/5199a33a-50dc-4571-8b1f-bc1eb00b54e3?format=jpeg",
        level: 0,
    },
    {
        name: "Home & Living",
        slug: "home-and-living",
        image: "https://cdn.cosmos.so/64986e58-da40-41e5-b0e2-1d041230c287?format=jpeg",
        level: 0,
    },
    {
        name: "Babies & Toddlers",
        slug: "babies-and-toddlers",
        image: "https://cdn.cosmos.so/8f0e2e15-4940-42f1-880a-58a692c03fa7?format=jpeg",
        level: 0,
    },
    {
        name: "Electronics",
        slug: "electronics",
        image: "https://cdn.cosmos.so/f78c6679-210d-4ac3-9891-2b63dfce19f1?format=jpeg",
        level: 0,
    }
];

async function seedCategories() {
    console.log("Seeding categories...");

    for (const cat of CATEGORY_DATA) {
        const existing = await db.query.categories.findFirst({
            where: (categories, { eq }) => eq(categories.slug, cat.slug),
        });

        if (existing) {
            console.log(`Updating category: ${cat.name}`);
            await db
                .update(categories)
                .set({
                    image: cat.image,
                    name: cat.name,
                    level: cat.level,
                })
                .where(eq(categories.slug, cat.slug));
        } else {
            console.log(`Creating category: ${cat.name}`);
            await db.insert(categories).values(cat);
        }
    }
}

async function seed() {
    try {
        await seedCategories();
        console.log("Seeding complete.");
    } catch (err) {
        console.error("Seeding failed:", err);
    }
}

seed();
