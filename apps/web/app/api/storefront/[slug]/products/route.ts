import { NextRequest, NextResponse } from "next/server";

import { storefrontService } from "@/app/[handle]/lib/storefront-service";



type RouteParams = {

    params: Promise<{ slug: string }>;

};



type ProductMedia = {
    media?: {
        blobUrl?: string | null;
        blobPathname?: string | null;
        contentType?: string | null;
    } | null;
};

type StorefrontProduct = {
    id: string;
    slug: string | null;
    productName: string;
    priceAmount: unknown;
    currency: string;
    media?: ProductMedia[];
    rating?: number;
    ratingCount?: number;
};

function toCanonicalUploadThingUrl(rawUrl: string) {
    try {
        const parsed = new URL(rawUrl);
        const fileId = parsed.pathname.split("/").filter(Boolean).pop();
        if (!fileId) return rawUrl;

        const isUploadThingHost = parsed.hostname.endsWith(".ufs.sh") || parsed.hostname === "utfs.io";
        if (!isUploadThingHost) return rawUrl;

        return `https://utfs.io/f/${fileId}`;
    } catch {
        return rawUrl;
    }
}

function resolveMediaUrl(entry?: ProductMedia | null): string | null {
    if (!entry?.media) {
        return null;
    }

    const { blobUrl, blobPathname } = entry.media;

    if (blobPathname) {
        if (/^https?:\/\//i.test(blobPathname)) {
            return toCanonicalUploadThingUrl(blobPathname);
        }

        return `https://utfs.io/f/${blobPathname.replace(/^\/+/, "")}`;
    }

    if (blobUrl) {
        return toCanonicalUploadThingUrl(blobUrl);
    }

    return null;
}

function resolveMediaContentType(entry?: ProductMedia | null): string | null {
    if (!entry?.media) {
        return null;
    }

    return entry.media.contentType ?? null;
}



/**

 * GET /api/storefront/[slug]/products

 * Returns store products list

 */

export async function GET(request: NextRequest, { params }: RouteParams) {

    try {

        const { slug } = await params;

        const { searchParams } = new URL(request.url);

        const q = (searchParams.get("q") || "").trim();

        const collection = (searchParams.get("collection") || searchParams.get("category") || "").trim();

        const store = await storefrontService.findStoreBySlug(slug);



        if (!store) {

            return NextResponse.json({ error: "Store not found" }, { status: 404 });

        }



        const productList = collection

            ? await storefrontService.getStoreProductsByCollectionSlug(store.id, collection, q)

            : await storefrontService.getStoreProducts(store.id, q);



        return NextResponse.json(

            (productList as StorefrontProduct[]).map((product) => ({

                id: product.id,

                slug: product.slug || product.productName.toLowerCase().replace(/\s+/g, "-"),

                name: product.productName,

                price: Number(product.priceAmount || 0),

                currency: product.currency,

                image: resolveMediaUrl(product.media?.[0]),

                contentType: resolveMediaContentType(product.media?.[0]),

                rating: 0,

            }))

        );

    } catch (error) {

        console.error("Error fetching products:", error);

        return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });

    }

}

