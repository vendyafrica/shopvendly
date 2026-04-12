import { getApiBaseUrl } from "@/shared/lib/api-utils";
import { instagramSyncSchema } from "@/modules/instagram/types";
import { withApi } from "@/shared/lib/api/with-api";
import { HttpError, jsonProxy } from "@/shared/lib/api/response-utils";

export const POST = withApi({ schema: instagramSyncSchema }, async ({ session, body }) => {
  const { storeId, limit } = body;

  const apiBase = getApiBaseUrl();
  if (!apiBase) throw new HttpError("Missing NEXT_PUBLIC_API_URL; cannot reach Express API for Instagram sync.", 500);

  const internalApiKey = process.env.INTERNAL_API_KEY;
  if (!internalApiKey) throw new HttpError("Missing INTERNAL_API_KEY; cannot call internal Instagram sync endpoint.", 500);

  const endpoint = limit ? "sync-posts" : "sync";
  const response = await fetch(`${apiBase}/api/internal/instagram/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-internal-api-key": internalApiKey },
    body: JSON.stringify({ storeId, userId: session.user.id, limit }),
    cache: "no-store",
  });

  return jsonProxy(response);
});
