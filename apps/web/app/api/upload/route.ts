import { NextResponse } from "next/server";

export async function POST(request: Request): Promise<NextResponse> {
    void request;
    return NextResponse.json(
        {
            error: "Legacy Vercel Blob upload endpoint is disabled. Use /api/uploadthing instead.",
        },
        { status: 410 }
    );
}

