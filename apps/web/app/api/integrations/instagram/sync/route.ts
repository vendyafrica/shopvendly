import { auth } from "@shopvendly/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@shopvendly/db/db";
import { account, instagramAccounts, stores, tenantMemberships } from "@shopvendly/db/schema";
import { and, eq } from "@shopvendly/db";
import { z } from "zod";

const bodySchema = z.object({
  storeId: z.string().uuid(),
});

type InstagramMeResponse =
  | { data: Array<Record<string, unknown>>; error?: unknown }
  | { error?: unknown };

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
    });

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const instagramAuthAccount = await db.query.account.findFirst({
      where: and(eq(account.userId, session.user.id), eq(account.providerId, "instagram")),
    });

    if (!instagramAuthAccount?.accessToken) {
      return NextResponse.json({ error: "Instagram not connected" }, { status: 400 });
    }

    const response = await fetch(
      `https://graph.instagram.com/v24.0/me?fields=user_id,username,account_type,profile_picture_url&access_token=${instagramAuthAccount.accessToken}`
    );

    const text = await response.text();
    let json: InstagramMeResponse;
    try {
      json = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: "Instagram returned non-JSON response" }, { status: 502 });
    }

    const payload = Array.isArray((json as { data?: unknown })?.data)
      ? (json as { data: Array<Record<string, unknown>> }).data[0]
      : (json as Record<string, unknown>);

    const payloadErr = (payload as { error?: unknown }).error;
    const jsonErr = (json as { error?: unknown }).error;

    if (!response.ok || payloadErr || jsonErr) {
      const err = payloadErr || jsonErr;
      return NextResponse.json(
        { error: (err as { message?: string } | null)?.message || "Failed to fetch Instagram profile" },
        { status: 502 }
      );
    }

    const igUserId = (payload as { user_id?: string }).user_id;
    const username = (payload as { username?: string }).username;
    const accountType = (payload as { account_type?: string }).account_type;
    const profilePictureUrl = (payload as { profile_picture_url?: string }).profile_picture_url;

    if (igUserId) {
      const existing = await db.query.instagramAccounts.findFirst({
        where: and(eq(instagramAccounts.tenantId, membership.tenantId), eq(instagramAccounts.userId, session.user.id)),
      });

      if (existing) {
        await db
          .update(instagramAccounts)
          .set({
            username: username ?? existing.username,
            accountType: accountType ?? existing.accountType,
            profilePictureUrl: profilePictureUrl ?? existing.profilePictureUrl,
            isActive: true,
            lastSyncedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(instagramAccounts.id, existing.id));
      } else {
        await db.insert(instagramAccounts).values({
          tenantId: membership.tenantId,
          userId: session.user.id,
          accountId: igUserId,
          username: username ?? null,
          accountType: accountType ?? null,
          profilePictureUrl: profilePictureUrl ?? null,
          isActive: true,
          lastSyncedAt: new Date(),
        });
      }
    }

    if (profilePictureUrl) {
      await db
        .update(stores)
        .set({ logoUrl: profilePictureUrl, updatedAt: new Date() })
        .where(and(eq(stores.id, storeId), eq(stores.tenantId, membership.tenantId)));
    }

    return NextResponse.json({
      ok: true,
      storeId,
      logoUrl: profilePictureUrl ?? null,
      instagram: {
        userId: igUserId ?? null,
        username: username ?? null,
        accountType: accountType ?? null,
      },
    });
  } catch (error) {
    console.error("Instagram sync error:", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
