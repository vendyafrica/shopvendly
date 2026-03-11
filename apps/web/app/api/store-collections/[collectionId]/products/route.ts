import { auth } from "@shopvendly/auth";
import { and, eq, inArray } from "@shopvendly/db";
import { db } from "@shopvendly/db/db";
import { productCollections, products, storeCollections, stores } from "@shopvendly/db/schema";
import { headers } from "next/headers";
import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveTenantAdminAccessByStoreId } from "@/app/admin/lib/admin-access";

const updateProductsSchema = z.object({
  productIds: z.array(z.string().uuid()).default([]),
});

type RouteParams = {
  params: Promise<{ collectionId: string }>;
};

export async function GET(_request: NextRequest, { params }: RouteParams) {
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

    const access = await resolveTenantAdminAccessByStoreId(session.user.id, collection.storeId, "read");
    if (!access.store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }
    if (!access.isAuthorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const links = await db.query.productCollections.findMany({
      where: eq(productCollections.collectionId, collectionId),
      columns: { productId: true },
    });

    return NextResponse.json({ productIds: links.map((link) => link.productId) });
  } catch (error) {
    console.error("Error fetching collection products:", error);
    return NextResponse.json({ error: "Failed to fetch collection products" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { collectionId } = await params;
    const { productIds } = updateProductsSchema.parse(await request.json());

    const collection = await db.query.storeCollections.findFirst({
      where: eq(storeCollections.id, collectionId),
      columns: { id: true, storeId: true, tenantId: true },
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

    const normalizedIds = Array.from(new Set(productIds));

    const validProducts = normalizedIds.length
      ? await db.query.products.findMany({
        where: and(
          eq(products.storeId, collection.storeId),
          eq(products.tenantId, collection.tenantId),
          inArray(products.id, normalizedIds)
        ),
        columns: { id: true },
      })
      : [];

    await db.delete(productCollections).where(eq(productCollections.collectionId, collectionId));

    if (validProducts.length > 0) {
      await db.insert(productCollections).values(
        validProducts.map((product) => ({
          collectionId,
          productId: product.id,
        }))
      );
    }

    const store = await db.query.stores.findFirst({
      where: eq(stores.id, collection.storeId),
      columns: { slug: true },
    });

    if (store?.slug) {
      revalidateTag(`storefront:store:${store.slug}:collections`, "max");
      revalidateTag(`storefront:store:${store.slug}:products`, "max");
    }

    return NextResponse.json({
      success: true,
      productCount: validProducts.length,
      productIds: validProducts.map((p) => p.id),
    });
  } catch (error) {
    console.error("Error updating collection products:", error);
    return NextResponse.json({ error: "Failed to update collection products" }, { status: 500 });
  }
}
