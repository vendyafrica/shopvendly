import { storeRepo } from "@/modules/storefront/repo/store-repo";
import { tenantMembershipRepo } from "@/modules/admin/repo/tenant-membership-repo";
import { getApiBaseUrl } from "@/shared/lib/api-utils";
import { withApi } from "@/shared/lib/api/with-api";
import { HttpError, jsonProxy } from "@/shared/lib/api/response-utils";

export const GET = withApi<undefined, { storeId: string }>({}, async ({ session, params }) => {
  const { storeId } = params;
  const store = await storeRepo.findById(storeId);
  if (!store) throw new HttpError("Store not found", 404);

  const membership = await tenantMembershipRepo.findByUserAndTenant(session.user.id, store.tenantId);
  if (!membership) throw new HttpError("Forbidden", 403);

  const apiBase = getApiBaseUrl();
  if (!apiBase) throw new HttpError("Missing NEXT_PUBLIC_API_URL; cannot reach Express API for Collecto balance.", 500);

  const response = await fetch(`${apiBase}/api/stores/${encodeURIComponent(storeId)}/collecto/available-balance`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  return jsonProxy(response);
});
