import { NextResponse } from "next/server";

import { checkSuperAdminApi } from "@/lib/auth-guard";

function getApiBaseCandidates() {
    const apiBaseFromEnv = process.env.NEXT_PUBLIC_API_URL;
    const apiBase = apiBaseFromEnv ?? (process.env.NODE_ENV === "development" ? "http://127.0.0.1:8000" : undefined);

    return Array.from(
        new Set([
            apiBase,
            ...(apiBase?.includes("localhost") ? [apiBase.replace("localhost", "127.0.0.1")] : []),
        ])
    ).filter((value): value is string => Boolean(value));
}

export async function POST(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await checkSuperAdminApi(["super_admin"]);
    if (auth.error) {
        return NextResponse.json(auth, { status: auth.status });
    }

    const { id } = await params;
    const apiBaseCandidates = getApiBaseCandidates();

    if (!apiBaseCandidates.length) {
        return NextResponse.json({ error: "Missing NEXT_PUBLIC_API_URL; cannot reach Express API." }, { status: 500 });
    }

    for (const baseUrl of apiBaseCandidates) {
        try {
            const res = await fetch(`${baseUrl}/api/stores/${encodeURIComponent(id)}/collecto/initiate-payout`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });
            const json = await res.json().catch(() => ({}));
            return NextResponse.json(json, { status: res.status });
        } catch (error) {
            console.error("Collecto payout initiation proxy failed", { baseUrl, id, error });
        }
    }

    return NextResponse.json({ error: "Could not reach API server for Collecto payout." }, { status: 502 });
}
