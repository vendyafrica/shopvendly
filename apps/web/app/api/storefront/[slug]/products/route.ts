import { NextRequest, NextResponse } from "next/server";
import { storefrontService } from "@/modules/storefront";
import type { StorefrontProduct, StorefrontProductMedia, StorefrontProductVariantSummary, StorefrontProductsRouteParams } from "@/models/storefront";

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

function resolveMediaUrl(entry?: StorefrontProductMedia | null): string | null {
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

function resolveMediaContentType(entry?: StorefrontProductMedia | null): string | null {
    if (!entry?.media) {
        return null;
    }

    return entry.media.contentType ?? null;
}

/**

 * GET /api/storefront/[slug]/products

 * Returns store products list

 */

export async function GET(request: NextRequest, { params }: StorefrontProductsRouteParams) {

    try {

        const { slug } = await params;

        const { searchParams } = new URL(request.url);

        const q = (searchParams.get("q") || "").trim();

        const collection = (searchParams.get("collection") || searchParams.get("category") || "").trim();

        const section = (searchParams.get("section") || "").trim().toLowerCase();

        const store = await storefrontService.findStoreBySlug(slug);

        if (!store) {

            return NextResponse.json({ error: "Store not found" }, { status: 404 });

        }

        const fetchedProducts = collection
            ? await storefrontService.getStoreProductsByCollectionSlug(store.id, collection, q)
            : await storefrontService.getStoreProducts(store.id, q);

        let productList = fetchedProducts as StorefrontProduct[];

        if (section === "sale") {
            productList = productList.filter((product) => {
                const livePrice = Number(product.priceAmount || 0);
                const originalPrice = Number(product.originalPriceAmount || 0);
                return originalPrice > livePrice && livePrice >= 0;
            });
        }

        if (section === "new-arrivals") {
            productList = [...productList]
                .sort((a, b) => new Date(String(b.createdAt ?? 0)).getTime() - new Date(String(a.createdAt ?? 0)).getTime())
                .slice(0, 12);
        }

        return NextResponse.json(
            productList.map((product) => {
                const price = Number(product.priceAmount || 0);
                const originalPrice = Number(product.originalPriceAmount || 0);
                const hasSale = originalPrice > price;
                const discountPercent = hasSale && originalPrice > 0
                    ? Math.round(((originalPrice - price) / originalPrice) * 100)
                    : null;

                const variantOptions = product.variants?.enabled
                    ? product.variants.options ?? []
                    : [];

                const variantSummary: StorefrontProductVariantSummary = {
                    hasColors: variantOptions.some((option) => option.type === "color" && (option.values?.length ?? 0) > 0),
                    hasSizes: variantOptions.some((option) => option.type === "size" && (option.values?.length ?? 0) > 0),
                };

                return {
                    id: product.id,
                    slug: product.slug || product.productName.toLowerCase().replace(/\s+/g, "-"),
                    name: product.productName,
                    price,
                    originalPrice: hasSale ? originalPrice : null,
                    hasSale,
                    discountPercent,
                    currency: product.currency,
                    image: resolveMediaUrl(product.media?.[0]),
                    contentType: resolveMediaContentType(product.media?.[0]),
                    variantSummary,
                    averageRating: product.rating ?? 0,
                    ratingCount: product.ratingCount ?? 0,
                };
            })
        );

    } catch (error) {

        console.error("Error fetching products:", error);

        return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });

    }

}
