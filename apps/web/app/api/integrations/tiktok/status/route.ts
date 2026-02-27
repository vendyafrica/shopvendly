import { auth } from "@shopvendly/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@shopvendly/db/db";
import { account, stores, tenantMemberships } from "@shopvendly/db/schema";
import { and, eq, sql } from "@shopvendly/db";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ connected: false }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("storeId");

    const tiktokAccount = await db.query.account.findFirst({
      where: and(eq(account.userId, session.user.id), eq(account.providerId, "tiktok")),
      columns: {
        accessToken: true,
        scope: true,
      },
    });

    const scopes = tiktokAccount?.scope
      ? tiktokAccount.scope.split(",").map((scope) => scope.trim()).filter(Boolean)
      : [];

    let storeLinked = false;
    if (storeId) {
      const membership = await db.query.tenantMemberships.findFirst({
        where: eq(tenantMemberships.userId, session.user.id),
      });

      if (membership) {
        const store = await db.query.stores.findFirst({
          where: and(eq(stores.id, storeId), eq(stores.tenantId, membership.tenantId)),
          columns: { id: true },
        });

        if (store) {
          const linked = await db.execute(sql`
            select id
            from tiktok_accounts
            where store_id = ${storeId}
              and tenant_id = ${membership.tenantId}
              and is_active = true
            limit 1
          `);
          storeLinked = Array.isArray(linked.rows) && linked.rows.length > 0;
        }
      }
    }

    return NextResponse.json({
      connected: Boolean(tiktokAccount?.accessToken),
      scopes,
      storeLinked,
    });
  } catch (error) {
    console.error("TikTok status check error:", error);
    return NextResponse.json({ connected: false, scopes: [], storeLinked: false }, { status: 500 });
  }
}
