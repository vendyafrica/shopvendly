import { auth } from "@shopvendly/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { cartService } from "@/features/cart/lib/cart-service";

type RouteParams = {
    params: Promise<{ productId: string }>;
};

/**
 * DELETE /api/cart/items/[productId]
 * Remove a specific item from the cart
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { productId } = await params;
        const selectedOptionsParam = request.nextUrl.searchParams.get("selectedOptions");
        const selectedOptions = selectedOptionsParam ? JSON.parse(selectedOptionsParam) : undefined;
        await cartService.removeItem(session.user.id, productId, selectedOptions);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error removing item:", error);
        return NextResponse.json({ error: "Failed to remove item" }, { status: 500 });
    }
}
