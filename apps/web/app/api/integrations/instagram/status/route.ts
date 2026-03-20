import { auth } from "@shopvendly/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { resolveTenantAdminAccessByStoreId } from "@/app/admin/lib/admin-access";
import { instagramRepo } from "@/repo/instagram-repo";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ connected: false, imported: false }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("storeId");

    let membershipTenantId: string | null = null;

    if (storeId) {
      const access = await resolveTenantAdminAccessByStoreId(session.user.id, storeId, "read");
      if (!access.store || !access.isAuthorized) {
        return NextResponse.json({ connected: false, imported: false }, { status: 404 });
      }

      membershipTenantId = access.store.tenantId;
    }

    // Check better-auth account link
    const instagramAuthAccount = await instagramRepo.findAuthAccount(session.user.id);

    let hasTenantInstagramAccount = false;

    if (membershipTenantId) {
      hasTenantInstagramAccount = Boolean(
        await instagramRepo.hasTenantAccount(membershipTenantId, session.user.id)
      );
    }

    const isConnected = !!instagramAuthAccount?.accessToken && hasTenantInstagramAccount;
    let isImported = false;

    if (isConnected && storeId) {
      // Verify store access (optional but good practice)
      // For now, just check if products exist for this store and source=instagram
      isImported = await instagramRepo.hasImportedProducts(storeId);
    }

    return NextResponse.json({ connected: isConnected, imported: isImported });
  } catch (error) {
    console.error("Instagram status check error:", error);
    return NextResponse.json({ connected: false, imported: false }, { status: 500 });
  }
}
