import { NextResponse } from "next/server";
import { db } from "@shopvendly/db/db";
import { users, session as sessionTable, verification } from "@shopvendly/db/schema";
import { eq, and } from "@shopvendly/db";
import crypto from "crypto";

/**
 * GET /api/auth/verify-seller?token=xxx&email=xxx&redirect=/a/store-slug
 *
 * Called when a new seller clicks a CTA in their welcome email.
 * - Validates the token (time-bound 24h, single-use)
 * - Marks the user's email as verified
 * - Creates a session (auto-login)
 * - Redirects to the requested destination (dashboard or integrations)
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    const email = searchParams.get("email")?.toLowerCase();
    const redirectTo = searchParams.get("redirect") || "/";

    if (!token || !email) {
      return NextResponse.redirect(
        new URL("/login?error=invalid-verification-link", req.url)
      );
    }

    // Look up the verification record
    const record = await db.query.verification.findFirst({
      where: and(
        eq(verification.identifier, email),
        eq(verification.value, token)
      ),
    });

    if (!record) {
      return NextResponse.redirect(
        new URL("/login?error=invalid-or-expired-link", req.url)
      );
    }

    if (new Date() > new Date(record.expiresAt)) {
      await db.delete(verification).where(eq(verification.id, record.id));
      return NextResponse.redirect(
        new URL("/login?error=link-expired", req.url)
      );
    }

    // Find the user
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      await db.delete(verification).where(eq(verification.id, record.id));
      return NextResponse.redirect(
        new URL("/login?error=user-not-found", req.url)
      );
    }

    // Mark email as verified
    if (!user.emailVerified) {
      await db
        .update(users)
        .set({ emailVerified: true })
        .where(eq(users.id, user.id));
    }

    // Delete the verification token (single-use)
    await db.delete(verification).where(eq(verification.id, record.id));

    // Create a session manually to auto-login the seller
    const sessionToken = crypto.randomBytes(32).toString("hex");
    const sessionId = crypto.randomBytes(16).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await db.insert(sessionTable).values({
      id: sessionId,
      token: sessionToken,
      userId: user.id,
      expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
      ipAddress: req.headers.get("x-forwarded-for") || null,
      userAgent: req.headers.get("user-agent") || null,
    });

    // Build redirect response with session cookie
    const redirectUrl = new URL(redirectTo, req.url);
    const response = NextResponse.redirect(redirectUrl);

    // Set session cookie matching Better Auth's cookie format
    const isProd = process.env.NODE_ENV === "production";
    const isSecure = isProd || new URL(req.url).protocol === "https:";
    const cookieName = isSecure
      ? "__Secure-vendly.session_token"
      : "vendly.session_token";

    response.cookies.set(cookieName, sessionToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: isSecure ? "none" : "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Seller verification error:", error);
    return NextResponse.redirect(
      new URL("/login?error=verification-failed", req.url)
    );
  }
}
