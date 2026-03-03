import { NextRequest, NextResponse } from "next/server";
import { collectPayment } from "@/lib/dgateway";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, currency, phone_number, provider, description, metadata } = body ?? {};

    if (!amount || !currency || !phone_number) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "amount, currency and phone_number are required" } },
        { status: 400 }
      );
    }

    const result = await collectPayment({
      amount: Number(amount),
      currency: String(currency).toUpperCase(),
      phone_number: String(phone_number),
      provider: provider || "iotec",
      description,
      metadata,
    });

    if (result.error) {
      const status = result.error.status ?? 400;
      return NextResponse.json(result, { status });
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to initiate payment" } },
      { status: 500 }
    );
  }
}
