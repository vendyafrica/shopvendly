import { jsonError } from "@/shared/lib/api/response-utils";

export async function POST() {
    return jsonError(
        "Legacy Vercel Blob upload endpoint is disabled. Use /api/uploadthing instead.",
        410,
    );
}
