import { NextRequest, NextResponse } from "next/server";

type RouteParams = {
  params: Promise<{ orderId: string }>;
};

// POST /api/storefront/orders/[orderId]/pay
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { orderId } = await params;
    const apiBase = process.env.NEXT_PUBLIC_API_URL;

    if (!apiBase) {
      return NextResponse.json(
        { error: "Missing NEXT_PUBLIC_API_URL; cannot reach Express API." },
        { status: 500 }
      );
    }

    const res = await fetch(`${apiBase}/api/storefront/orders/${orderId}/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(json || { error: "Failed to mark order paid" }, { status: res.status });
    }

    return NextResponse.json(json, { status: 200 });
  } catch (error) {
    console.error("Error proxying order payment:", error);
    return NextResponse.json({ error: "Failed to mark order paid" }, { status: 500 });
  }
}
