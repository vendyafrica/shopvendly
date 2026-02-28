import { NextResponse } from "next/server";

export async function GET(req: Request) {
    return NextResponse.redirect(
        new URL("/login?error=invalid-verification-link", req.url)
    );
}
