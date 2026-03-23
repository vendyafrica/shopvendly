import { auth } from "@shopvendly/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { revalidateTag } from "next/cache";
import { resolveTenantAdminAccessByStoreId } from "@/modules/admin";
import { storeCollectionsRepo } from "@/repo/store-collections-repo";
import { storeRepo } from "@/repo/store-repo";

const createCollectionSchema = z.object({
  storeId: z.string().uuid(),
  name: z.string().min(1).max(120),
  image: z.string().url().optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("storeId") || "";
    const q = (searchParams.get("q") || "").trim();

    if (!storeId) {
      return NextResponse.json({ error: "storeId is required" }, { status: 400 });
    }

    const store = await storeRepo.findById(storeId);

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const isDemoStore = store.slug === "vendly";

    if (!session?.user && !isDemoStore) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session?.user) {
      const access = await resolveTenantAdminAccessByStoreId(session.user.id, storeId, "read");
      if (!access.store) {
        return NextResponse.json({ error: "Store not found" }, { status: 404 });
      }
      if (!access.isAuthorized) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const collections = await storeCollectionsRepo.listByStore(storeId, q);

    return NextResponse.json(collections);
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

    const slug = await storeCollectionsRepo.generateUniqueSlugForCreate(payload.storeId, payload.name);
    const nextSortOrder = await storeCollectionsRepo.getNextSortOrder(payload.storeId);

    const created = await storeCollectionsRepo.createCollection({
      tenantId: access.store.tenantId,
      storeId: payload.storeId,
      name: payload.name.trim(),
      slug,
      image: payload.image ?? null,
      sortOrder: nextSortOrder,
    });

    const store = await storeCollectionsRepo.findStoreSlugByStoreId(payload.storeId);

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
