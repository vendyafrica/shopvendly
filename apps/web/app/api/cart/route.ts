import { NextRequest } from "next/server";
import { cartService } from "@/modules/cart";
import { instagramRepo } from "@/repo/instagram-repo";
import { type CartItemWithRelations, addItemToCartSchema } from "@/models";
import { DEFAULT_STORE_LOGO } from "@/lib/constants/defaults";
import { withApi } from "@/lib/api/with-api";
import { jsonSuccess } from "@/lib/api/response-utils";

/**
 * GET /api/cart
 * Fetch the current user's cart
 */
export const GET = withApi({}, async ({ session }) => {
    const { items } = await cartService.getUserCart(session.user.id);

    // Batch Instagram profile pic lookups to avoid N+1
    const tenantIds = Array.from(new Set(
        items
            .map((item: CartItemWithRelations) => item.product.store?.tenantId)
            .filter((id): id is string => typeof id === "string" && id.length > 0)
    ));

    const igAccounts = await Promise.all(
        tenantIds.map((id) => instagramRepo.findActiveByTenantId(id))
    );

    const igMap = new Map<string, string>();
    tenantIds.forEach((id, i) => {
        const pic = igAccounts[i]?.profilePictureUrl;
        if (pic) igMap.set(id, pic);
    });

    const formattedItems = items.map((item: CartItemWithRelations) => {
        const storeTenantId = item.product.store?.tenantId;

        return {
            id: item.id,
            quantity: item.quantity,
            product: {
                id: item.product.id,
                name: item.product.productName,
                price: item.product.priceAmount,
                originalPrice: (item.product as { originalPriceAmount?: number | null }).originalPriceAmount ?? null,
                currency: item.product.currency,
                image: item.product.media?.[0]?.media?.blobUrl ?? null,
                contentType: item.product.media?.[0]?.media?.contentType ?? null,
                slug: (item.product as { slug?: string })?.slug
                    ?? item.product.productName.toLowerCase().replace(/\s+/g, "-"),
                availableQuantity: (item.product as { quantity?: number })?.quantity ?? null,
                selectedOptions: Array.isArray(item.selectedOptions)
                    ? item.selectedOptions
                        .filter((option): option is { name: string; value: string } => Boolean(option?.name && option?.value))
                        .map((option) => ({ name: option.name, value: option.value }))
                    : [],
            },
            store: {
                id: item.product.store?.id,
                name: item.product.store?.name,
                slug: item.product.store?.slug,
                logoUrl: storeTenantId
                    ? item.product.store?.logoUrl ?? igMap.get(storeTenantId) ?? DEFAULT_STORE_LOGO
                    : item.product.store?.logoUrl ?? DEFAULT_STORE_LOGO,
            },
        };
    });

    return jsonSuccess(formattedItems);
});

/**
 * POST /api/cart
 * Add or update an item in the cart
 */
export const POST = withApi({ schema: addItemToCartSchema }, async ({ session, body }) => {
    const { productId, storeId, quantity, selectedOptions } = body;
    await cartService.upsertItem(session.user.id, productId, storeId, quantity, selectedOptions ?? undefined);
    return jsonSuccess({ success: true });
});

/**
 * DELETE /api/cart
 * Clear the cart (optionally for a specific store)
 */
export const DELETE = withApi({}, async ({ req, session }) => {
    const storeId = new URL(req.url).searchParams.get("storeId") ?? undefined;
    await cartService.clearCart(session.user.id, storeId);
    return jsonSuccess({ success: true });
});
