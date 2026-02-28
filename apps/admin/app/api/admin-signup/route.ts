import { db } from "@shopvendly/db/db";
import { users, verification, account, superAdmins } from "@shopvendly/db/schema";
import { NextResponse } from "next/server";
import { sendAdminVerificationEmail } from "@shopvendly/transactional";
import { auth } from "@shopvendly/auth/server";
import { eq, and } from "@shopvendly/db";
import crypto from "crypto";
import { scryptAsync } from "@noble/hashes/scrypt";

const SCRYPT_CONFIG = { N: 16384, r: 16, p: 1, dkLen: 64 };

async function hashPassword(password: string): Promise<string> {
    const salt = crypto.randomBytes(16).toString("hex");
    const key = await scryptAsync(password.normalize("NFKC"), salt, {
        N: SCRYPT_CONFIG.N,
        r: SCRYPT_CONFIG.r,
        p: SCRYPT_CONFIG.p,
        dkLen: SCRYPT_CONFIG.dkLen,
        maxmem: 128 * SCRYPT_CONFIG.N * SCRYPT_CONFIG.r * 2,
    });
    return `${salt}:${Buffer.from(key).toString("hex")}`;
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, password, name } = body;

        if (!email || !password || !name) {
            return NextResponse.json(
                { error: "Email, password, and name are required" },
                { status: 400 }
            );
        }

        const normalizedEmail = (email as string).trim().toLowerCase();

        const origin = new URL(req.url).origin;
        console.info("[admin-signup] Attempt", { email: normalizedEmail, origin });

        const existingSuperAdmin = await db.query.superAdmins.findFirst({
            columns: { id: true },
        });

        if (existingSuperAdmin) {
            return NextResponse.json(
                { error: "Super admin already exists. Please request an invite." },
                { status: 403 }
            );
        }

        // Check if user already exists
        const existingUser = await db.query.users.findFirst({
            where: eq(users.email, normalizedEmail),
        });

        if (existingUser) {
            console.info("[admin-signup] Existing user detected", {
                email,
                hasPassword: !!existingUser.emailVerified,
            });
            // Check if user already has a credential account
            const existingCredential = await db.query.account.findFirst({
                where: and(
                    eq(account.userId, existingUser.id),
                    eq(account.providerId, "credential"),
                ),
            });

            if (existingCredential) {
                console.warn("[admin-signup] Existing credential prevents signup", { email });
                return NextResponse.json(
                    { error: "User with this email already exists" },
                    { status: 422 }
                );
            }

            // User exists (e.g. from Google OAuth) but has no credential account.
            // Create the credential account row with hashed password so email/password sign-in works.
            const hashedPassword = await hashPassword(password);

            await db.insert(account).values({
                id: crypto.randomUUID(),
                accountId: existingUser.id,
                providerId: "credential",
                userId: existingUser.id,
                password: hashedPassword,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            // Mark email as verified if not already (user already proved ownership via OAuth)
            if (!existingUser.emailVerified) {
                await db
                    .update(users)
                    .set({ emailVerified: true })
                    .where(eq(users.id, existingUser.id));
            }

            // Send verification email for super_admin bootstrap
            const existingSuperAdmin = await db.query.superAdmins.findFirst({
                columns: { id: true },
            });

            let verificationEmailSent = false;
            let verificationEmailError: string | null = null;

            const token = crypto.randomBytes(32).toString("hex");
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
            const identifier = `super_admin_bootstrap:${normalizedEmail}`;

            await db.delete(verification).where(eq(verification.identifier, identifier));

            await db.insert(verification).values({
                id: crypto.randomUUID(),
                identifier,
                value: token,
                expiresAt,
            });

            const verificationUrl = `${origin}/api/verify-email?token=${token}&email=${encodeURIComponent(normalizedEmail)}`;

            try {
                await sendAdminVerificationEmail({
                    to: normalizedEmail,
                    name: existingUser.name,
                    verificationUrl,
                });
                verificationEmailSent = true;
            } catch (emailErr) {
                verificationEmailError = emailErr instanceof Error ? emailErr.message : "Failed to send verification email";
                console.error("[admin-signup] Verification email failed for existing user", {
                    email: normalizedEmail,
                    error: verificationEmailError,
                });
            }

            console.info("[admin-signup] Existing user credential bootstrap complete", {
                email: normalizedEmail,
                verificationEmailSent,
                verificationNeeded: true,
            });

            return NextResponse.json({
                success: true,
                message: existingSuperAdmin
                    ? "Credential account created. You can now sign in."
                    : verificationEmailError
                        ? "Credential account created, but verification email failed."
                        : "Credential account created! Please check your email to verify.",
                verificationEmailSent,
                verificationEmailError,
            });
        }

        // New user: use Better Auth server API (creates user + credential account + sends verification)
        try {
            await auth.api.signUpEmail({
                body: {
                    email: normalizedEmail,
                    password,
                    name,
                    callbackURL: `${origin}/login?message=email-verified`,
                },
            });
        } catch (signupError) {
            console.error("Better Auth signUpEmail error:", signupError);
            return NextResponse.json(
                { error: "Failed to create account. Please try again." },
                { status: 500 }
            );
        }

        // Create bootstrap verification token + email
        let verificationEmailSent = false;
        let verificationEmailError: string | null = null;

        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const identifier = `super_admin_bootstrap:${normalizedEmail}`;

        await db.delete(verification).where(eq(verification.identifier, identifier));

        await db.insert(verification).values({
            id: crypto.randomUUID(),
            identifier,
            value: token,
            expiresAt,
        });

        const verificationUrl = `${origin}/api/verify-email?token=${token}&email=${encodeURIComponent(normalizedEmail)}`;

        try {
            await sendAdminVerificationEmail({
                to: normalizedEmail,
                name,
                verificationUrl,
            });
            verificationEmailSent = true;
        } catch (emailErr) {
            verificationEmailError = emailErr instanceof Error ? emailErr.message : "Failed to send verification email";
            console.error("[admin-signup] Verification email failed for new user", {
                email: normalizedEmail,
                error: verificationEmailError,
            });
        }

        console.info("[admin-signup] New user created via Better Auth", { email });

        return NextResponse.json({
            success: true,
            message: "Account created! Please check your email to verify your account.",
            verificationEmailSent,
            verificationEmailError,
        });
    } catch (error) {
        console.error("Admin signup error:", error);
        return NextResponse.json(
            { error: "Failed to create account. Please try again." },
            { status: 500 }
        );
    }
}
