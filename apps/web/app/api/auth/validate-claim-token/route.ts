import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@shopvendly/auth";
import { authRepo } from "@/repo/auth-repo";
import { verificationRepo } from "@/repo/verification-repo";

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
    const record = await verificationRepo.findByEmailAndToken(email.toLowerCase(), token);

    if (!record) {
      return NextResponse.json(
        { error: "Invalid or expired claim token" },
        { status: 404 }
      );
    }

    if (new Date() > new Date(record.expiresAt)) {
      await verificationRepo.deleteById(record.id);
      return NextResponse.json(
        { error: "Claim token has expired" },
        { status: 410 }
      );
    }

    // Find the store claimed by this email
    const store = await authRepo.findStoreByClaimedEmail(email.toLowerCase());

    if (!store) {
      return NextResponse.json(
        { error: "No store found for this claim" },
        { status: 404 }
      );
    }

    // Check if user is already a member of this tenant
    const existingMembership = await authRepo.findTenantMembership(store.tenantId, session.user.id);

    if (!existingMembership) {
      // Add user as owner of the tenant
      await authRepo.addTenantMembership(store.tenantId, session.user.id, "owner");
    }

    // Reset tenant to onboarding state so user can update store details
    await authRepo.resetTenantOnboarding(store.tenantId);

    // Delete the verification token (single-use)
    await verificationRepo.deleteById(record.id);

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
