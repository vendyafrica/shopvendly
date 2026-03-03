import { NextRequest, NextResponse } from "next/server";
import { verifyTransaction } from "@/lib/dgateway";

export async function POST(request: NextRequest) {
  try {
    const { reference } = await request.json();

    if (!reference) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "reference is required" } },
        { status: 400 }
      );
    }

    const result = await verifyTransaction(String(reference));

    if (result.error) {
      const status = result.error.status ?? 400;
      return NextResponse.json(result, { status });
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to verify payment" } },
      { status: 500 }
    );
  }
}
