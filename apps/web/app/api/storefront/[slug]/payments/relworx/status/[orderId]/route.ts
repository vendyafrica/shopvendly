import { NextRequest, NextResponse } from "next/server";

type RouteParams = {
    params: Promise<{ slug: string; orderId: string }>;
};

export async function GET(_request: NextRequest, { params }: RouteParams) {
    try {
        const { slug, orderId } = await params;

        const apiBaseFromEnv = process.env.NEXT_PUBLIC_API_URL;
        const apiBase =
            apiBaseFromEnv ??
            (process.env.NODE_ENV === "development" ? "http://127.0.0.1:8000" : undefined);
        const apiBaseCandidates = Array.from(
            new Set([
                apiBase,
                ...(apiBase?.includes("localhost") ? [apiBase.replace("localhost", "127.0.0.1")] : []),
            ])
        ).filter((value): value is string => Boolean(value));

        if (!apiBase) {
            return NextResponse.json(
                { error: "Missing NEXT_PUBLIC_API_URL; cannot reach Express API." },
                { status: 500 }
            );
        }

        let res: Response | null = null;
        for (const baseUrl of apiBaseCandidates) {
            try {
                res = await fetch(`${baseUrl}/api/storefront/${slug}/payments/relworx/status/${orderId}`);
                break;
            } catch (err) {
                console.error("[Web->API Proxy] Failed to reach Express API for Relworx status", {
                    baseUrl,
                    slug,
                    orderId,
                    err,
                });
            }
        }

        if (!res) {
            return NextResponse.json(
                {
                    error: "Could not reach API server. Start apps/api (port 8000) or set NEXT_PUBLIC_API_URL to the correct base URL.",
                    tried: apiBaseCandidates,
                },
                { status: 502 }
            );
        }

        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
            return NextResponse.json(json || { error: "Failed to fetch Relworx payment status" }, { status: res.status });
        }

        return NextResponse.json(json, { status: 200 });
    } catch (error) {
        console.error("Error proxying Relworx status to Express API:", error);
        return NextResponse.json({ error: "Failed to fetch Relworx payment status" }, { status: 500 });
    }
}
