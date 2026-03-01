import { auth } from "@shopvendly/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@shopvendly/db/db";
import { account, instagramAccounts, instagramSyncJobs, products, mediaObjects } from "@shopvendly/db/schema";
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

    // Delete Instagram-imported products for this tenant (product_media cascades via FK)
    await db
      .delete(products)
      .where(and(eq(products.tenantId, membership.tenantId), eq(products.source, "instagram")));

    // Delete Instagram media objects for this tenant
    await db
      .delete(mediaObjects)
      .where(and(eq(mediaObjects.tenantId, membership.tenantId), eq(mediaObjects.source, "instagram")));

    // Remove Instagram sync jobs for this tenant
    await db
      .delete(instagramSyncJobs)
      .where(eq(instagramSyncJobs.tenantId, membership.tenantId));

    // Remove OAuth account tokens for Instagram
    await db
      .delete(account)
      .where(and(eq(account.userId, session.user.id), eq(account.providerId, "instagram")));

    // Remove Instagram account records for this tenant/user
    await db
      .delete(instagramAccounts)
      .where(and(eq(instagramAccounts.tenantId, membership.tenantId), eq(instagramAccounts.userId, session.user.id)));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Instagram delete error:", error);
    return NextResponse.json({ error: "Failed to delete Instagram data" }, { status: 500 });
  }
}
