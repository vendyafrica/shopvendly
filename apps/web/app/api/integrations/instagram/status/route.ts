import { auth } from "@shopvendly/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@shopvendly/db/db";
import { account, instagramAccounts, products } from "@shopvendly/db/schema";
import { eq, and } from "@shopvendly/db";
import { resolveTenantAdminAccessByStoreId } from "@/app/admin/lib/admin-access";

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
    const instagramAuthAccount = await db.query.account.findFirst({
      where: and(
        eq(account.userId, session.user.id),
        eq(account.providerId, "instagram"),
      ),
    });

    let hasTenantInstagramAccount = false;

    if (membershipTenantId) {
      const instagramAccount = await db.query.instagramAccounts.findFirst({
        where: and(
          eq(instagramAccounts.tenantId, membershipTenantId),
          eq(instagramAccounts.userId, session.user.id)
        ),
        columns: { id: true },
      });

      hasTenantInstagramAccount = Boolean(instagramAccount);
    }

    const isConnected = !!instagramAuthAccount?.accessToken && hasTenantInstagramAccount;
    let isImported = false;

    if (isConnected && storeId) {
      // Verify store access (optional but good practice)
      // For now, just check if products exist for this store and source=instagram
      const existingProduct = await db.query.products.findFirst({
        where: and(
          eq(products.storeId, storeId),
          eq(products.source, "instagram")
        ),
        columns: { id: true }
      });

      if (existingProduct) {
        isImported = true;
      }
    }

    return NextResponse.json({ connected: isConnected, imported: isImported });
  } catch (error) {
    console.error("Instagram status check error:", error);
    return NextResponse.json({ connected: false, imported: false }, { status: 500 });
  }
}
