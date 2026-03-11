import { auth } from "@shopvendly/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { db, instagramAccounts, eq, and } from "@shopvendly/db";
const DEFAULT_STORE_LOGO = "/vendly.png";
import { cartService } from "@/features/cart/lib/cart-service";

type CartItemWithRelations = {
    id: string;
    productId: string;
    quantity: number;
    selectedOptions?: Array<{ name?: string; value?: string }> | null;
    product: {
        id: string;
        productName: string;
        priceAmount: number;
        currency: string;
        media?: { media?: { blobUrl?: string | null; contentType?: string | null } | null }[];
        store?: {
            id?: string;
            name?: string;
            slug?: string;
            tenantId?: string;
            logoUrl?: string | null;
        };
    };
};

/**
 * GET /api/cart
 * Fetch the current user's cart
 */
export async function GET() {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { items } = await cartService.getUserCart(session.user.id);

        // Fetch Instagram profile pictures for involved tenants
        const tenantIds = Array.from(new Set(
            items
                .map((item: CartItemWithRelations) => item.product.store?.tenantId)
                .filter((id): id is string => typeof id === "string" && id.length > 0)
        ));

        const igMap = new Map<string, string>();
        for (const tenantId of tenantIds) {
            const igAccount = await db.query.instagramAccounts.findFirst({
                where: and(
                    eq(instagramAccounts.tenantId, tenantId),
                    eq(instagramAccounts.isActive, true)
                )
            });

            if (igAccount?.profilePictureUrl) {
                igMap.set(tenantId, igAccount.profilePictureUrl);
            }
        }

        // Format for frontend
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

        return NextResponse.json(formattedItems);
    } catch (error) {
        console.error("Error fetching cart:", error);
        return NextResponse.json({ error: "Failed to fetch cart" }, { status: 500 });
    }
}

/**
 * POST /api/cart
 * Add or update an item in the cart
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { productId, storeId, quantity, selectedOptions } = await request.json();

        if (!productId || !storeId || quantity === undefined) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const updated = await cartService.upsertItem(session.user.id, productId, storeId, quantity, selectedOptions);
        return NextResponse.json(updated);
    } catch (error) {
        console.error("Error updating cart:", error);
        return NextResponse.json({ error: "Failed to update cart" }, { status: 500 });
    }
}

/**
 * DELETE /api/cart
 * Clear the cart (optionally for a specific store)
 */
export async function DELETE(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const storeId = searchParams.get("storeId") ?? undefined;

        await cartService.clearCart(session.user.id, storeId);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error clearing cart:", error);
        return NextResponse.json({ error: "Failed to clear cart" }, { status: 500 });
    }
}
