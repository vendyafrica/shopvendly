import { jsonError } from "@/shared/lib/api/response-utils";

// POST /api/storefront/orders/[orderId]/pay â€” disabled
export async function POST(_request: Request, { params }: { params: Promise<{ orderId: string }> }) {
    const { orderId } = await params;
    return jsonError(
        "Payment routes are disabled. Orders currently run on manual delivery and cash collection.",
        410,
        { orderId },
    );
}
