import { NextResponse } from "next/server";

type RouteParams = {
  params: Promise<{ orderId: string }>;
};

// POST /api/storefront/orders/[orderId]/pay
export async function POST(request: Request, { params }: RouteParams) {
  try {
    void request;
    const { orderId } = await params;
    return NextResponse.json(
      {
        error: "Payment routes are disabled. Orders currently run on manual delivery and cash collection.",
        orderId,
      },
      { status: 410 }
    );
  } catch (error) {
    console.error("Error handling disabled payment route:", error);
    return NextResponse.json({ error: "Payment routes are disabled." }, { status: 500 });
  }
}
