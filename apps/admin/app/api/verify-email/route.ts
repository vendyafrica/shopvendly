import { db } from "@shopvendly/db/db";
import { users, verification, superAdmins } from "@shopvendly/db/schema";
import { eq, and } from "@shopvendly/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const token = searchParams.get("token");
        const email = searchParams.get("email");

        if (!token || !email) {
            return NextResponse.redirect(
                new URL("/login?error=invalid-verification-link", req.url)
            );
        }

        // Find verification record
        const verificationRecord = await db.query.verification.findFirst({
            where: and(
                eq(verification.identifier, email),
                eq(verification.value, token)
            ),
        });

        if (!verificationRecord) {
            return NextResponse.redirect(
                new URL("/login?error=invalid-or-expired-token", req.url)
            );
        }

        // Check if token is expired
        if (new Date() > new Date(verificationRecord.expiresAt)) {
            return NextResponse.redirect(
                new URL("/login?error=token-expired", req.url)
            );
        }

        // Find user
        const user = await db.query.users.findFirst({
            where: eq(users.email, email),
        });

        if (!user) {
            return NextResponse.redirect(
                new URL("/login?error=user-not-found", req.url)
            );
        }

        // Update user as verified
        await db
            .update(users)
            .set({ emailVerified: true })
            .where(eq(users.id, user.id));

        // Assign super_admin role
        const existingRole = await db.query.superAdmins.findFirst({
            where: eq(superAdmins.userId, user.id),
        });

        const existingSuperAdmin = await db.query.superAdmins.findFirst({
            columns: { id: true },
        });

        if (!existingRole && !existingSuperAdmin) {
            await db.insert(superAdmins).values({
                userId: user.id,
                role: "super_admin",
            });
            console.log(`Assigned super_admin role to ${user.email}`);
        }

        // Delete verification record
        await db.delete(verification).where(eq(verification.id, verificationRecord.id));

        // Redirect to login with success message
        return NextResponse.redirect(
            new URL("/login?message=email-verified", req.url)
        );
    } catch (error) {
        console.error("Email verification error:", error);
        return NextResponse.redirect(
            new URL("/login?error=verification-failed", req.url)
        );
    }
}
