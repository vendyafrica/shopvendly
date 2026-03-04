import { NextResponse } from "next/server";

export async function POST() {
  try {
    return NextResponse.json(
      { error: { code: "PAYMENT_DISABLED", message: "Online checkout payments are currently disabled." } },
      { status: 410 }
    );
  } catch {
    return NextResponse.json(
      { error: { code: "PAYMENT_DISABLED", message: "Online checkout payments are currently disabled." } },
      { status: 500 }
    );
  }
}
