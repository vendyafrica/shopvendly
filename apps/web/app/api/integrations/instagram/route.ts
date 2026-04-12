import { tenantMembershipRepo } from "@/modules/admin/repo/tenant-membership-repo";
import { instagramRepo } from "@/modules/instagram/repo/instagram-repo";
import { withApi } from "@/shared/lib/api/with-api";
import { jsonSuccess, HttpError } from "@/shared/lib/api/response-utils";

export const DELETE = withApi({}, async ({ session }) => {
  const membership = await tenantMembershipRepo.findByUserId(session.user.id);
  if (!membership) throw new HttpError("No tenant found", 404);
  await instagramRepo.clearInstagramDataForTenant(session.user.id, membership.tenantId);
  return jsonSuccess({ ok: true });
});
