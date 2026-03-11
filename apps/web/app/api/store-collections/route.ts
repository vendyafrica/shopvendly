import { auth } from "@shopvendly/auth";
import { and, asc, count, eq, ilike, inArray, or, sql } from "@shopvendly/db";
import { db } from "@shopvendly/db/db";
import { productCollections, storeCollections, stores } from "@shopvendly/db/schema";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { revalidateTag } from "next/cache";
import { resolveTenantAdminAccessByStoreId } from "@/app/admin/lib/admin-access";

const createCollectionSchema = z.object({
  storeId: z.string().uuid(),
  name: z.string().min(1).max(120),
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

async function generateUniqueCollectionSlug(storeId: string, name: string) {
  const base = slugifyName(name) || "collection";
  let slug = base;
  let counter = 1;

  while (
    await db.query.storeCollections.findFirst({
      where: and(eq(storeCollections.storeId, storeId), eq(storeCollections.slug, slug)),
      columns: { id: true },
    })
  ) {
    slug = `${base}-${counter++}`;
  }

  return slug;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("storeId") || "";
    const q = (searchParams.get("q") || "").trim();

    if (!storeId) {
      return NextResponse.json({ error: "storeId is required" }, { status: 400 });
    }

    const access = await resolveTenantAdminAccessByStoreId(session.user.id, storeId, "read");
    if (!access.store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }
    if (!access.isAuthorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const whereClause = q
      ? and(
          eq(storeCollections.storeId, storeId),
          or(ilike(storeCollections.name, `%${q}%`), ilike(storeCollections.slug, `%${q}%`))
        )
      : eq(storeCollections.storeId, storeId);

    const collections = await db.query.storeCollections.findMany({
      where: whereClause,
      orderBy: [asc(storeCollections.name)],
      columns: {
        id: true,
        name: true,
        slug: true,
        image: true,
        sortOrder: true,
      },
    });

    const ids = collections.map((collection) => collection.id);
    const counts = ids.length
      ? await db
          .select({
            collectionId: productCollections.collectionId,
            total: count(productCollections.id),
          })
          .from(productCollections)
          .where(inArray(productCollections.collectionId, ids))
          .groupBy(productCollections.collectionId)
      : [];

    const countMap = new Map(counts.map((row) => [row.collectionId, Number(row.total) || 0]));

    return NextResponse.json(
      collections.map((collection) => ({
        ...collection,
        productCount: countMap.get(collection.id) ?? 0,
      }))
    );
  } catch (error) {
    console.error("Error listing store collections:", error);
    return NextResponse.json({ error: "Failed to list collections" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = createCollectionSchema.parse(await request.json());

    const access = await resolveTenantAdminAccessByStoreId(session.user.id, payload.storeId, "write");
    if (!access.store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }
    if (!access.isAuthorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const slug = await generateUniqueCollectionSlug(payload.storeId, payload.name);

    const sortRows = await db
      .select({ maxSort: sql<number>`COALESCE(MAX(${storeCollections.sortOrder}), -1)` })
      .from(storeCollections)
      .where(eq(storeCollections.storeId, payload.storeId));

    const nextSortOrder = Number(sortRows[0]?.maxSort ?? -1) + 1;

    const [created] = await db
      .insert(storeCollections)
      .values({
        tenantId: access.store.tenantId,
        storeId: payload.storeId,
        name: payload.name.trim(),
        slug,
        image: payload.image ?? null,
        sortOrder: nextSortOrder,
      })
      .returning({
        id: storeCollections.id,
        name: storeCollections.name,
        slug: storeCollections.slug,
        image: storeCollections.image,
        sortOrder: storeCollections.sortOrder,
      });

    const store = await db.query.stores.findFirst({
      where: eq(stores.id, payload.storeId),
      columns: { slug: true },
    });

    if (store?.slug) {
      revalidateTag(`storefront:store:${store.slug}:collections`, "default");
      revalidateTag(`storefront:store:${store.slug}:products`, "default");
    }

    return NextResponse.json({ ...created, productCount: 0 }, { status: 201 });
  } catch (error) {
    console.error("Error creating store collection:", error);
    return NextResponse.json({ error: "Failed to create collection" }, { status: 500 });
  }
}
