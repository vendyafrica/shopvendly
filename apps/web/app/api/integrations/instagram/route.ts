import { auth } from "@shopvendly/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@shopvendly/db/db";
import { account, instagramAccounts } from "@shopvendly/db/schema";
import { and, eq } from "@shopvendly/db";
import { tenantMemberships } from "@shopvendly/db/schema";

export async function DELETE() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure user is linked to a tenant
    const membership = await db.query.tenantMemberships.findFirst({
      where: eq(tenantMemberships.userId, session.user.id),
    });

    if (!membership) {
      return NextResponse.json({ error: "No tenant found" }, { status: 404 });
    }

    // Remove OAuth account tokens for Instagram
    await db
      .delete(account)
      .where(and(eq(account.userId, session.user.id), eq(account.providerId, "instagram")));

    // Remove Instagram account records for this tenant/user (sync jobs cascade via FK)
    await db
      .delete(instagramAccounts)
      .where(and(eq(instagramAccounts.tenantId, membership.tenantId), eq(instagramAccounts.userId, session.user.id)));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Instagram delete error:", error);
    return NextResponse.json({ error: "Failed to delete Instagram data" }, { status: 500 });
  }
}
