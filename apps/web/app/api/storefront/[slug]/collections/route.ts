import { NextRequest, NextResponse } from "next/server";
import { storefrontService } from "@/modules/storefront/data";

import { type CollectionRouteParams as RouteParams } from "@/models";

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();

    const store = await storefrontService.findStoreBySlug(slug);
    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const collections = await storefrontService.getStoreCollections(store.id, q);
    return NextResponse.json(collections);
  } catch (error) {
    console.error("Error fetching storefront collections:", error);
    return NextResponse.json({ error: "Failed to fetch collections" }, { status: 500 });
  }
}
