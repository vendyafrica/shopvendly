import { storeRepo } from "@/repo/store-repo";
import { tenantMembershipRepo } from "@/repo/tenant-membership-repo";
import { getApiBaseUrl } from "@/lib/api-utils";
import { withApi } from "@/lib/api/with-api";
import { HttpError, jsonProxy } from "@/lib/api/response-utils";

export const POST = withApi<undefined, { storeId: string }>({}, async ({ session, params }) => {
  const { storeId } = params;
  const store = await storeRepo.findById(storeId);
  if (!store) throw new HttpError("Store not found", 404);

  const membership = await tenantMembershipRepo.findByUserAndTenant(session.user.id, store.tenantId);
  if (!membership) throw new HttpError("Forbidden", 403);

  const apiBase = getApiBaseUrl();
  if (!apiBase) throw new HttpError("Missing NEXT_PUBLIC_API_URL; cannot reach Express API for Collecto payout.", 500);

  const response = await fetch(`${apiBase}/api/stores/${encodeURIComponent(storeId)}/collecto/initiate-payout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  return jsonProxy(response);
});
