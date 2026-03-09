import { NextRequest, NextResponse } from "next/server";
import {
  collectoFetch,
  collectoStatusBodySchema,
  getCollectoMode,
  getMockStatus,
  isCollectoConfiguredForLive,
  normalizeCollectoStatus,
  type CollectoStatusResponse,
} from "@/features/orders/lib/collecto";

type CollectoStatusPayload = Record<string, unknown>;

function readCandidateStatus(payload: CollectoStatusPayload): unknown {
  return payload.status ?? payload.paymentStatus ?? payload.transactionStatus ?? payload.state ?? payload.message;
}

export async function POST(request: NextRequest) {
  try {
    const body = collectoStatusBodySchema.parse(await request.json());
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
      return NextResponse.json(
        {
          ok: true,
          mode: "mock",
          transactionId: body.transactionId,
          status: getMockStatus(body.transactionId),
          message: "Collecto mock status returned.",
        } satisfies CollectoStatusResponse,
        { status: 200 }
      );
    }

    const response = await collectoFetch("requestToPayStatus", {
      transactionId: body.transactionId,
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error: {
            code: "COLLECTO_STATUS_FAILED",
            message: "Failed to fetch Collecto payment status.",
            details: response.json || response.text,
          },
        },
        { status: response.status || 502 }
      );
    }

    const payload = ((response.json ?? {}) as CollectoStatusPayload);

    return NextResponse.json(
      {
        ok: true,
        mode: "live",
        transactionId: body.transactionId,
        status: normalizeCollectoStatus(readCandidateStatus(payload)),
        raw: response.json,
      } satisfies CollectoStatusResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error("Collecto status error:", error);
    return NextResponse.json(
      {
        error: {
          code: "COLLECTO_STATUS_ERROR",
          message: error instanceof Error ? error.message : "Failed to fetch Collecto payment status.",
        },
      },
      { status: 500 }
    );
  }
}
