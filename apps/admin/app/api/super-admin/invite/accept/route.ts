import { NextResponse } from "next/server";
import { db } from "@shopvendly/db/db";
import { users, verification, superAdmins } from "@shopvendly/db/schema";
import { eq, and } from "@shopvendly/db";
import { auth } from "@shopvendly/auth";
import { headers } from "next/headers";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const token = searchParams.get("token");
        const email = searchParams.get("email")?.toLowerCase();

        if (!token || !email) {
            return NextResponse.redirect(new URL("/login?error=invalid-invite-link", req.url));
        }

        const identifier = `super_admin_invite:${email}`;

        const inviteRecord = await db.query.verification.findFirst({
            where: and(eq(verification.identifier, identifier), eq(verification.value, token)),
        });

        if (!inviteRecord) {
            return NextResponse.redirect(new URL("/login?error=invalid-or-expired-invite", req.url));
        }

        if (new Date() > new Date(inviteRecord.expiresAt)) {
            return NextResponse.redirect(new URL("/login?error=invite-expired", req.url));
        }

        const user = await db.query.users.findFirst({
            where: eq(users.email, email),
        });

        const acceptUrl = new URL(req.url);

        if (!user) {
            const redirect = encodeURIComponent(acceptUrl.pathname + acceptUrl.search);
            return NextResponse.redirect(new URL(`/login?error=invite-login-required&redirect=${redirect}`, req.url));
        }

        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            const redirect = encodeURIComponent(acceptUrl.pathname + acceptUrl.search);
            return NextResponse.redirect(new URL(`/login?redirect=${redirect}`, req.url));
        }

        if (session.user.email.toLowerCase() !== email) {
            return NextResponse.redirect(new URL("/unauthorized", req.url));
        }

        const existingRole = await db.query.superAdmins.findFirst({
            where: eq(superAdmins.userId, session.user.id),
        });

        if (!existingRole) {
            await db.insert(superAdmins).values({
                userId: session.user.id,
                role: "super_admin",
            });
        }

        await db.delete(verification).where(eq(verification.id, inviteRecord.id));

        return NextResponse.redirect(new URL("/tenants?message=invite-accepted", req.url));
    } catch (error) {
        console.error("Accept super admin invite error:", error);
        return NextResponse.redirect(new URL("/login?error=invite-accept-failed", req.url));
    }
}
