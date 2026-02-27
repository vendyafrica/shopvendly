import { db } from "@shopvendly/db/db";
import { categories } from "@shopvendly/db/schema";
import { eq, asc } from "@shopvendly/db";
import { NextResponse } from "next/server";
import { checkSuperAdminApi } from "@/lib/auth-guard";

export async function GET() {
    // Public or Admin? "Manage categories" implies Admin.
    // But storefront needs them too. This is ADMIN API.
    const auth = await checkSuperAdminApi(["super_admin"]);
    if (auth.error) {
        const isPublic = false; // Set to true if categories are public via this API? No, use explicit public API for storefront.
        if (!isPublic) return NextResponse.json(auth, { status: auth.status });
    }

    try {
        const data = await db.query.categories.findMany({
            orderBy: [asc(categories.level), asc(categories.name)],
        });
        return NextResponse.json(data);
    } catch (error) {
        console.error("Categories API Error:", error);
        return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const auth = await checkSuperAdminApi(["super_admin"]);
    if (auth.error) {
        return NextResponse.json(auth, { status: auth.status });
    }

    try {
        const body = await req.json();
        const { name, slug, image, parentId } = body;

        if (!name || !slug) {
            return NextResponse.json({ error: "Name and Slug are required" }, { status: 400 });
        }

        const existing = await db.query.categories.findFirst({
            where: eq(categories.slug, slug)
        });
        if (existing) {
            return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
        }

        let level = 0;
        if (parentId) {
            const parent = await db.query.categories.findFirst({
                where: eq(categories.id, parentId),
            });
            if (!parent) {
                return NextResponse.json({ error: "Parent category not found" }, { status: 400 });
            }
            level = parent.level + 1;
        }

        const [newCategory] = await db
            .insert(categories)
            .values({
                name,
                slug,
                image,
                parentId: parentId || null,
                level,
            })
            .returning();

        return NextResponse.json(newCategory);
    } catch (error) {
        console.error("Create Category API Error:", error);
        return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
    }
}
