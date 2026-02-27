import { auth } from "@shopvendly/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@shopvendly/db/db";
import { account, stores, tenantMemberships } from "@shopvendly/db/schema";
import { and, eq, sql } from "@shopvendly/db";
import { z } from "zod";

const bodySchema = z.object({
  storeId: z.string().uuid(),
});

const USER_INFO_FIELDS = ["open_id", "avatar_url", "display_name", "username"].join(",");

type TikTokUserInfoResponse = {
  data?: {
    user?: {
      open_id?: string;
      avatar_url?: string;
      display_name?: string;
      username?: string;
    };
  };
  error?: {
    code?: string;
    message?: string;
    log_id?: string;
  };
};

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const membership = await db.query.tenantMemberships.findFirst({
      where: eq(tenantMemberships.userId, session.user.id),
    });

    if (!membership) {
      return NextResponse.json({ error: "No tenant found" }, { status: 404 });
    }

    const body = await request.json();
    const { storeId } = bodySchema.parse(body);

    const store = await db.query.stores.findFirst({
      where: and(eq(stores.id, storeId), eq(stores.tenantId, membership.tenantId)),
      columns: { id: true, tenantId: true },
    });

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const linkedTikTokAuth = await db.query.account.findFirst({
      where: and(eq(account.userId, session.user.id), eq(account.providerId, "tiktok")),
      columns: {
        accountId: true,
        accessToken: true,
      },
    });

    if (!linkedTikTokAuth?.accessToken) {
      return NextResponse.json({ error: "TikTok not connected" }, { status: 400 });
    }

    const profileResponse = await fetch(
      `https://open.tiktokapis.com/v2/user/info/?fields=${encodeURIComponent(USER_INFO_FIELDS)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${linkedTikTokAuth.accessToken}`,
        },
        cache: "no-store",
      }
    );

    const text = await profileResponse.text();
    let profilePayload: TikTokUserInfoResponse;
    try {
      profilePayload = JSON.parse(text) as TikTokUserInfoResponse;
    } catch {
      return NextResponse.json({ error: "TikTok returned non-JSON profile response" }, { status: 502 });
    }

    if (!profileResponse.ok || (profilePayload.error?.code && profilePayload.error.code !== "ok")) {
      return NextResponse.json(
        {
          error: profilePayload.error?.message || "Failed to fetch TikTok profile",
          code: profilePayload.error?.code || "tiktok_profile_error",
        },
        { status: 502 }
      );
    }

    const tiktokUser = profilePayload.data?.user;
    const providerAccountId = tiktokUser?.open_id || linkedTikTokAuth.accountId;

    if (!providerAccountId) {
      return NextResponse.json({ error: "TikTok account id missing" }, { status: 502 });
    }

    const existingResult = await db.execute(sql`
      select id, display_name, username, avatar_url
      from tiktok_accounts
      where store_id = ${storeId}
        and tenant_id = ${membership.tenantId}
      limit 1
    `);

    const existing = (existingResult.rows?.[0] ?? null) as
      | {
          id: string;
          display_name?: string | null;
          username?: string | null;
          avatar_url?: string | null;
        }
      | null;

    if (existing) {
      await db.execute(sql`
        update tiktok_accounts
        set
          user_id = ${session.user.id},
          provider_account_id = ${providerAccountId},
          display_name = ${tiktokUser?.display_name ?? existing.display_name ?? null},
          username = ${tiktokUser?.username ?? existing.username ?? null},
          avatar_url = ${tiktokUser?.avatar_url ?? existing.avatar_url ?? null},
          is_active = true,
          last_synced_at = now(),
          updated_at = now()
        where id = ${existing.id}
      `);
    } else {
      await db.execute(sql`
        insert into tiktok_accounts (
          tenant_id,
          store_id,
          user_id,
          provider_account_id,
          display_name,
          username,
          avatar_url,
          is_active,
          last_synced_at,
          created_at,
          updated_at
        ) values (
          ${membership.tenantId},
          ${storeId},
          ${session.user.id},
          ${providerAccountId},
          ${tiktokUser?.display_name ?? null},
          ${tiktokUser?.username ?? null},
          ${tiktokUser?.avatar_url ?? null},
          true,
          now(),
          now(),
          now()
        )
      `);
    }

    return NextResponse.json({
      ok: true,
      storeId,
      profile: {
        openId: providerAccountId,
        displayName: tiktokUser?.display_name ?? null,
        username: tiktokUser?.username ?? null,
        avatarUrl: tiktokUser?.avatar_url ?? null,
      },
    });
  } catch (error) {
    console.error("TikTok sync error:", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
