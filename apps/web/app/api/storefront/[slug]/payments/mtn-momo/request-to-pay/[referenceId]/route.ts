import { NextRequest, NextResponse } from "next/server";

type RouteParams = {
    params: Promise<{ slug: string; referenceId: string }>;
};

export async function GET(_request: NextRequest, { params }: RouteParams) {
    try {
        const { slug, referenceId } = await params;

        const apiBase = process.env.NEXT_PUBLIC_API_URL;
        if (!apiBase) {
            return NextResponse.json(
                { error: "Missing NEXT_PUBLIC_API_URL; cannot reach Express API." },
                { status: 500 }
            );
        }

        const res = await fetch(`${apiBase}/api/storefront/${slug}/payments/mtn-momo/request-to-pay/${referenceId}`);
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
            return NextResponse.json(json || { error: "Failed to fetch MTN MoMo status" }, { status: res.status });
        }

        return NextResponse.json(json, { status: 200 });
    } catch (error) {
        console.error("Error proxying MTN MoMo status to Express API:", error);
        return NextResponse.json({ error: "Failed to fetch MTN MoMo status" }, { status: 500 });
    }
}
