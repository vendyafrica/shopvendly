import { auth } from "@shopvendly/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { tenantMembershipRepo } from "@/repo/tenant-membership-repo";
import { instagramRepo } from "@/repo/instagram-repo";

export async function DELETE() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure user is linked to a tenant
    const membership = await tenantMembershipRepo.findByUserId(session.user.id);

    if (!membership) {
      return NextResponse.json({ error: "No tenant found" }, { status: 404 });
    }

    // Delete Instagram-imported products for this tenant (product_media cascades via FK)
    await instagramRepo.clearInstagramDataForTenant(session.user.id, membership.tenantId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Instagram delete error:", error);
    return NextResponse.json({ error: "Failed to delete Instagram data" }, { status: 500 });
  }
}
