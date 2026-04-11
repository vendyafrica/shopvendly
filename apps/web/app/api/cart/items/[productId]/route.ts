import { cartService } from "@/modules/cart";
import { withApi } from "@/lib/api/with-api";
import { jsonSuccess } from "@/lib/api/response-utils";

/**
 * DELETE /api/cart/items/[productId]
 * Remove a specific item from the cart
 */
export const DELETE = withApi<undefined, { productId: string }>(
    {},
    async ({ req, params, session }) => {
        const { productId } = params;
        const selectedOptionsParam = new URL(req.url).searchParams.get("selectedOptions");
        const selectedOptions = selectedOptionsParam ? JSON.parse(selectedOptionsParam) : undefined;
        await cartService.removeItem(session.user.id, productId, selectedOptions);
        return jsonSuccess({ success: true });
    },
);
