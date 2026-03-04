import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@shopvendly/auth";
import { db } from "@shopvendly/db/db";
import { verification, stores, tenants, tenantMemberships } from "@shopvendly/db/schema";
import { eq, and } from "@shopvendly/db";

/**
 * POST /api/auth/validate-claim-token
 * 
 * Validates a store claim token after a user has signed in via OAuth.
 * Links the user to the claimed store's tenant and returns store info.
 * 
 * Body: { token: string, email: string }
 * Returns: { success: true, storeId, storeSlug, tenantId, redirectTo }
 */
export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { token, email } = body;

    if (!token || !email) {
      return NextResponse.json({ error: "Missing token or email" }, { status: 400 });
    }

    // Verify the email matches the authenticated user
    if (session.user.email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json(
        { error: "Email mismatch. Please sign in with the invited email address." },
        { status: 403 }
      );
    }

    // Look up the verification record
    const record = await db.query.verification.findFirst({
      where: and(
        eq(verification.identifier, email.toLowerCase()),
        eq(verification.value, token)
      ),
    });

    if (!record) {
      return NextResponse.json(
        { error: "Invalid or expired claim token" },
        { status: 404 }
      );
    }

    if (new Date() > new Date(record.expiresAt)) {
      await db.delete(verification).where(eq(verification.id, record.id));
      return NextResponse.json(
        { error: "Claim token has expired" },
        { status: 410 }
      );
    }

    // Find the store claimed by this email
    const store = await db.query.stores.findFirst({
      where: eq(stores.claimedByEmail, email.toLowerCase()),
      columns: { id: true, slug: true, name: true, tenantId: true },
    });

    if (!store) {
      return NextResponse.json(
        { error: "No store found for this claim" },
        { status: 404 }
      );
    }

    // Check if user is already a member of this tenant
    const existingMembership = await db.query.tenantMemberships.findFirst({
      where: and(
        eq(tenantMemberships.tenantId, store.tenantId),
        eq(tenantMemberships.userId, session.user.id)
      ),
    });

    if (!existingMembership) {
      // Add user as owner of the tenant
      await db.insert(tenantMemberships).values({
        tenantId: store.tenantId,
        userId: session.user.id,
        role: "owner",
      });
    }

    // Reset tenant to onboarding state so user can update store details
    await db
      .update(tenants)
      .set({ 
        status: "onboarding", 
        onboardingStep: "signup",
        updatedAt: new Date()
      })
      .where(eq(tenants.id, store.tenantId));

    // Delete the verification token (single-use)
    await db.delete(verification).where(eq(verification.id, record.id));

    return NextResponse.json({
      success: true,
      storeId: store.id,
      storeSlug: store.slug,
      storeName: store.name,
      tenantId: store.tenantId,
      redirectTo: "/account",
      message: "Store claimed successfully. Complete onboarding to update your store details.",
    });
  } catch (error) {
    console.error("Claim token validation error:", error);
    return NextResponse.json(
      { error: "Failed to validate claim token" },
      { status: 500 }
    );
  }
}
