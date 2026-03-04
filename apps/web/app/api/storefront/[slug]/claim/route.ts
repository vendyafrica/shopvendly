import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@shopvendly/auth";
import { eq } from "@shopvendly/db";
import { db } from "@shopvendly/db/db";
import { stores, tenantMemberships, tenants } from "@shopvendly/db/schema";

type RouteParams = {
  params: Promise<{ slug: string }>;
};

export async function POST(_req: Request, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;

    const store = await db.query.stores.findFirst({
      where: eq(stores.slug, slug),
      columns: { id: true, slug: true, tenantId: true },
    });

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, store.tenantId),
      columns: { id: true, status: true, onboardingStep: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const claimable = tenant.status === "onboarding" || tenant.onboardingStep !== "complete";
    if (!claimable) {
      return NextResponse.json({ error: "This store is already claimed" }, { status: 409 });
    }

    const existingMembership = await db.query.tenantMemberships.findFirst({
      where: eq(tenantMemberships.userId, session.user.id),
      columns: { id: true, tenantId: true },
    });

    if (existingMembership && existingMembership.tenantId !== tenant.id) {
      return NextResponse.json(
        { error: "Your account already belongs to another store" },
        { status: 409 }
      );
    }

    if (!existingMembership) {
      await db.insert(tenantMemberships).values({
        tenantId: tenant.id,
        userId: session.user.id,
        role: "owner",
      });
    }

    await db
      .update(tenants)
      .set({ status: "onboarding", updatedAt: new Date() })
      .where(eq(tenants.id, tenant.id));

    return NextResponse.json({
      success: true,
      storeSlug: store.slug,
      redirectTo: "/account",
      message: "Store claimed. Complete onboarding to update store details.",
    });
  } catch (error) {
    console.error("Store claim error:", error);
    return NextResponse.json({ error: "Failed to claim store" }, { status: 500 });
  }
}
