import { resolveTenantAdminAccessByStoreId } from "@/modules/admin";
import { instagramRepo } from "@/modules/instagram/repo/instagram-repo";
import { withApi } from "@/shared/lib/api/with-api";
import { jsonSuccess, jsonError } from "@/shared/lib/api/response-utils";

export const GET = withApi({}, async ({ req, session }) => {
  const storeId = new URL(req.url).searchParams.get("storeId");

  let membershipTenantId: string | null = null;
  if (storeId) {
    const access = await resolveTenantAdminAccessByStoreId(session.user.id, storeId, "read");
    if (!access.store || !access.isAuthorized) {
      return jsonError("Not found", 404);
    }
    membershipTenantId = access.store.tenantId;
  }

  const instagramAuthAccount = await instagramRepo.findAuthAccount(session.user.id);

  let hasTenantInstagramAccount = false;
  if (membershipTenantId) {
    hasTenantInstagramAccount = Boolean(
      await instagramRepo.hasTenantAccount(membershipTenantId, session.user.id),
    );
  }

  const isConnected = !!instagramAuthAccount?.accessToken && hasTenantInstagramAccount;
  let isImported = false;
  if (isConnected && storeId) {
    isImported = await instagramRepo.hasImportedProducts(storeId);
  }

  return jsonSuccess({ connected: isConnected, imported: isImported });
});
