import { NextRequest, NextResponse } from "next/server";
import {
  buildMockTransactionId,
  collectoFetch,
  collectoInitiateBodySchema,
  getCollectoMode,
  isCollectoConfiguredForLive,
  normalizeCollectoPhone,
  type CollectoRequestToPayResponse,
} from "@/features/orders/lib/collecto";

type RouteParams = {
  params: Promise<{ slug: string }>;
};

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await params;
    const body = collectoInitiateBodySchema.parse(await request.json());
    const mode = getCollectoMode();

    if (mode === "disabled") {
      return NextResponse.json(
        {
          error: {
            code: "COLLECTO_DISABLED",
            message: "Mobile money is not enabled yet for this storefront.",
          },
        },
        { status: 503 }
      );
    }

    if (mode === "mock" || !isCollectoConfiguredForLive()) {
      const mockResponse: CollectoRequestToPayResponse = {
        ok: true,
        mode: "mock",
        transactionId: buildMockTransactionId(body.orderId),
        message: "Collecto mock payment request created.",
      };
      return NextResponse.json(mockResponse, { status: 202 });
    }

    const response = await collectoFetch("requestToPay", {
      paymentOption: "mobilemoney",
      phone: normalizeCollectoPhone(body.phone),
      amount: body.amount,
      reference: body.reference,
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error: {
            code: "COLLECTO_INITIATE_FAILED",
            message: "Failed to initiate Collecto mobile money payment.",
            details: response.json || response.text,
          },
        },
        { status: response.status || 502 }
      );
    }

    const payload = (response.json ?? {}) as Record<string, unknown>;
    const transactionId =
      (typeof payload.transactionId === "string" && payload.transactionId) ||
      (typeof payload.id === "string" && payload.id) ||
      (typeof payload.reference === "string" && payload.reference) ||
      (typeof payload.message === "string" && payload.message) ||
      body.reference;

    return NextResponse.json(
      {
        ok: true,
        mode: "live",
        transactionId,
        raw: response.json,
      } satisfies CollectoRequestToPayResponse,
      { status: 202 }
    );
  } catch (error) {
    console.error("Collecto initiate error:", error);
    return NextResponse.json(
      {
        error: {
          code: "COLLECTO_INITIATE_ERROR",
          message: error instanceof Error ? error.message : "Failed to initiate Collecto payment.",
        },
      },
      { status: 500 }
    );
  }
}
