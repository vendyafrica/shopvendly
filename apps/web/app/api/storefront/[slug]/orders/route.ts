import { z } from "zod";
import { createOrderSchema } from "@/modules/orders/services/order-models";
import { withApi } from "@/shared/lib/api/with-api";
import { jsonError, jsonProxy, HttpError } from "@/shared/lib/api/response-utils";

/**
 * POST /api/storefront/[slug]/orders
 * Create a new order from storefront checkout â€” proxies to Express API (public)
 */
export const POST = withApi<z.infer<typeof createOrderSchema>, { slug: string }>(
    { auth: false, schema: createOrderSchema },
    async ({ params, body }) => {
        const apiBase = process.env.NEXT_PUBLIC_API_URL
            ?? (process.env.NODE_ENV === "development" ? "http://127.0.0.1:8000" : undefined);

        if (!apiBase) {
            throw new HttpError("Missing NEXT_PUBLIC_API_URL; cannot reach Express API for order creation.", 500);
        }

        const apiBaseCandidates = Array.from(
            new Set([apiBase, ...(apiBase.includes("localhost") ? [apiBase.replace("localhost", "127.0.0.1")] : [])])
        ).filter(Boolean) as string[];

        let res: Response | null = null;
        for (const baseUrl of apiBaseCandidates) {
            try {
                res = await fetch(`${baseUrl}/api/storefront/${params.slug}/orders`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                    signal: AbortSignal.timeout(10_000),
                });
                break;
            } catch (err) {
                console.error("[Web->API Proxy] Failed to reach Express API", { baseUrl, err });
            }
        }

        if (!res) {
            return jsonError("Could not reach API server.", 502, { tried: apiBaseCandidates });
        }

        return jsonProxy(res);
    },
);
