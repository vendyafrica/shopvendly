import { NextRequest, NextResponse } from "next/server";

type RouteParams = {
    params: Promise<{ slug: string }>;
};

export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { slug } = await params;
        const body = await request.json();

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
                res = await fetch(`${baseUrl}/api/storefront/${slug}/payments/relworx/initiate`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                });
                break;
            } catch (err) {
                console.error("[Web->API Proxy] Failed to reach Express API for Relworx initiate", {
                    baseUrl,
                    slug,
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
            return NextResponse.json(json || { error: "Failed to initiate Relworx payment" }, { status: res.status });
        }

        return NextResponse.json(json, { status: res.status });
    } catch (error) {
        console.error("Error proxying Relworx initiate to Express API:", error);
        return NextResponse.json({ error: "Failed to initiate Relworx payment" }, { status: 500 });
    }
}
