import { auth } from "@shopvendly/auth";
import { headers } from "next/headers";
import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveTenantAdminAccessByStoreId } from "@/app/admin/lib/admin-access";
import { storeCollectionsRepo } from "@/repo/store-collections-repo";

const updateCollectionSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  image: z.string().url().optional().nullable(),
});

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

    const name = payload.name?.trim();
    const slug = name ? await storeCollectionsRepo.generateUniqueSlug(collection.storeId, name, collectionId) : undefined;

    const updated = await storeCollectionsRepo.updateCollection(collectionId, {
      ...(name ? { name, slug } : {}),
      ...(payload.image !== undefined ? { image: payload.image } : {}),
    });

    const store = await storeCollectionsRepo.findStoreSlugByStoreId(collection.storeId);

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

    await storeCollectionsRepo.deleteCollection(collectionId);

    const store = await storeCollectionsRepo.findStoreSlugByStoreId(collection.storeId);

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
