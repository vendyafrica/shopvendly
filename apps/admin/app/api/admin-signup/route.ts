import { NextResponse } from "next/server";
export async function POST() {
    return NextResponse.json(
        { error: "Email/password signup has been disabled. Continue with Google sign-in." },
        { status: 410 }
    );
}
