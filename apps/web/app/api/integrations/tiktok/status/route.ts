import { auth } from "@shopvendly/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@shopvendly/db/db";
import { tiktokAccounts, tiktokPosts } from "@shopvendly/db/schema";
import { and, eq, count } from "@shopvendly/db";
import { resolveTenantAdminAccessByStoreId } from "@/app/admin/lib/admin-access";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ connected: false }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("storeId");

    let storeLinked = false;
    let importedCount = 0;
    let profileUrl: string | null = null;
    let username: string | null = null;
    let lastImportedAt: Date | null = null;

    if (storeId) {
      const access = await resolveTenantAdminAccessByStoreId(session.user.id, storeId, "read");
      if (!access.store || !access.isAuthorized) {
        return NextResponse.json({ connected: false, storeLinked: false, importedCount: 0 }, { status: 404 });
      }

      const tenantId = access.store.tenantId;

      const linkedAccount = await db.query.tiktokAccounts.findFirst({
        where: and(
          eq(tiktokAccounts.storeId, storeId),
          eq(tiktokAccounts.tenantId, tenantId),
          eq(tiktokAccounts.isActive, true)
        ),
        columns: {
          id: true,
          profileUrl: true,
          username: true,
          lastImportedAt: true,
        },
      });

      storeLinked = !!linkedAccount;
      profileUrl = linkedAccount?.profileUrl ?? null;
      username = linkedAccount?.username ?? null;
      lastImportedAt = linkedAccount?.lastImportedAt ?? null;

      if (linkedAccount) {
        const [postsCount] = await db
          .select({ value: count() })
          .from(tiktokPosts)
          .where(
            and(
              eq(tiktokPosts.storeId, storeId),
              eq(tiktokPosts.tenantId, tenantId)
            )
          );

        importedCount = Number(postsCount?.value ?? 0);
      }
    }

    return NextResponse.json({
      connected: storeLinked,
      storeLinked,
      importedCount,
      profileUrl,
      username,
      lastImportedAt,
    });
  } catch (error) {
    console.error("TikTok status check error:", error);
    return NextResponse.json({ connected: false, storeLinked: false, importedCount: 0 }, { status: 500 });
  }
}