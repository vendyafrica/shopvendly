import { auth } from "@shopvendly/auth";
import { and, eq } from "@shopvendly/db";
import { db } from "@shopvendly/db/db";
import { storeCollections, stores } from "@shopvendly/db/schema";
import { headers } from "next/headers";
import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveTenantAdminAccessByStoreId } from "@/app/admin/lib/admin-access";

const updateCollectionSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  image: z.string().url().optional().nullable(),
});

function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function generateUniqueCollectionSlug(storeId: string, name: string, collectionId: string) {
  const base = slugifyName(name) || "collection";
  let slug = base;
  let counter = 1;

  while (true) {
    const row = await db.query.storeCollections.findFirst({
      where: and(eq(storeCollections.storeId, storeId), eq(storeCollections.slug, slug)),
      columns: { id: true },
    });

    if (!row || row.id === collectionId) {
      break;
    }

    slug = `${base}-${counter++}`;
  }

  return slug;
}

type RouteParams = {
  params: Promise<{ collectionId: string }>;
};

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { collectionId } = await params;
    const payload = updateCollectionSchema.parse(await request.json());

    const collection = await db.query.storeCollections.findFirst({
      where: eq(storeCollections.id, collectionId),
      columns: { id: true, storeId: true, name: true },
    });

    if (!collection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    const access = await resolveTenantAdminAccessByStoreId(session.user.id, collection.storeId, "write");
    if (!access.store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }
    if (!access.isAuthorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const name = payload.name?.trim();
    const slug = name ? await generateUniqueCollectionSlug(collection.storeId, name, collectionId) : undefined;

    const [updated] = await db
      .update(storeCollections)
      .set({
        ...(name ? { name, slug } : {}),
        ...(payload.image !== undefined ? { image: payload.image } : {}),
        updatedAt: new Date(),
      })
      .where(eq(storeCollections.id, collectionId))
      .returning({
        id: storeCollections.id,
        name: storeCollections.name,
        slug: storeCollections.slug,
        image: storeCollections.image,
        sortOrder: storeCollections.sortOrder,
      });

    const store = await db.query.stores.findFirst({
      where: eq(stores.id, collection.storeId),
      columns: { slug: true },
    });

    if (store?.slug) {
      revalidateTag(`storefront:store:${store.slug}:collections`, "default");
      revalidateTag(`storefront:store:${store.slug}:products`, "default");
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating collection:", error);
    return NextResponse.json({ error: "Failed to update collection" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { collectionId } = await params;

    const collection = await db.query.storeCollections.findFirst({
      where: eq(storeCollections.id, collectionId),
      columns: { id: true, storeId: true },
    });

    if (!collection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    const access = await resolveTenantAdminAccessByStoreId(session.user.id, collection.storeId, "write");
    if (!access.store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }
    if (!access.isAuthorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.delete(storeCollections).where(eq(storeCollections.id, collectionId));

    const store = await db.query.stores.findFirst({
      where: eq(stores.id, collection.storeId),
      columns: { slug: true },
    });

    if (store?.slug) {
      revalidateTag(`storefront:store:${store.slug}:collections`, "default");
      revalidateTag(`storefront:store:${store.slug}:products`, "default");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting collection:", error);
    return NextResponse.json({ error: "Failed to delete collection" }, { status: 500 });
  }
}
