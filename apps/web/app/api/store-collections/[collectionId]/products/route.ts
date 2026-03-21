import { auth } from "@shopvendly/auth";
import { headers } from "next/headers";
import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveTenantAdminAccessByStoreId } from "@/modules/admin";
import { storeCollectionsRepo } from "@/repo/store-collections-repo";

const updateProductsSchema = z.object({
  productIds: z.array(z.string().uuid()).default([]),
});

import { type CollectionItemRouteParams as RouteParams } from "@/models";

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { collectionId } = await params;

    const collection = await storeCollectionsRepo.findBasicById(collectionId);

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

    const productIds = await storeCollectionsRepo.findProductIdsByCollectionId(collectionId);

    return NextResponse.json({ productIds });
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

    const collection = await storeCollectionsRepo.findBasicById(collectionId);

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

    const validProducts = await storeCollectionsRepo.findValidProductsForCollection(
      collection.storeId,
      collection.tenantId,
      normalizedIds
    );

    await storeCollectionsRepo.replaceCollectionProducts(
      collectionId,
      validProducts.map((product) => product.id)
    );

    const store = await storeCollectionsRepo.findStoreSlugByStoreId(collection.storeId);

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
