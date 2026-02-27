import { db } from "@shopvendly/db/db";
import { categories } from "@shopvendly/db/schema";
import { eq } from "@shopvendly/db";
import { NextResponse } from "next/server";
import { checkSuperAdminApi } from "@/lib/auth-guard";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await checkSuperAdminApi(["super_admin"]);
    if (auth.error) {
        return NextResponse.json(auth, { status: auth.status });
    }
    const { id } = await params;

    const category = await db.query.categories.findFirst({
        where: eq(categories.id, id),
    });

    if (!category) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(category);
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await checkSuperAdminApi(["super_admin"]);
    if (auth.error) {
        return NextResponse.json(auth, { status: auth.status });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, slug, image, parentId } = body;

    try {
        const updateData: Partial<{
            name: string;
            slug: string;
            image: string | null;
            parentId: string | null;
            level: number;
        }> = {};
        if (name) updateData.name = name;
        if (slug) updateData.slug = slug;
        if (image !== undefined) updateData.image = image;

        if (parentId !== undefined) {
            updateData.parentId = parentId;
            if (parentId) {
                const parent = await db.query.categories.findFirst({ where: eq(categories.id, parentId) });
                if (parent) {
                    updateData.level = parent.level + 1;
                } else {
                    return NextResponse.json({ error: "Parent not found" }, { status: 400 });
                }
            } else {
                updateData.level = 0;
            }
        }

        await db.update(categories).set(updateData).where(eq(categories.id, id));
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Update Category API Error:", error);
        return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await checkSuperAdminApi(["super_admin"]);
    if (auth.error) {
        return NextResponse.json(auth, { status: auth.status });
    }

    const { id } = await params;

    try {
        await db.delete(categories).where(eq(categories.id, id));
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete Category API Error:", error);
        return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
    }
}
