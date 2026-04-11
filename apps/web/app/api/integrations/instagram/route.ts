import { tenantMembershipRepo } from "@/repo/tenant-membership-repo";
import { instagramRepo } from "@/repo/instagram-repo";
import { withApi } from "@/lib/api/with-api";
import { jsonSuccess, HttpError } from "@/lib/api/response-utils";

export const DELETE = withApi({}, async ({ session }) => {
  const membership = await tenantMembershipRepo.findByUserId(session.user.id);
  if (!membership) throw new HttpError("No tenant found", 404);
  await instagramRepo.clearInstagramDataForTenant(session.user.id, membership.tenantId);
  return jsonSuccess({ ok: true });
});
