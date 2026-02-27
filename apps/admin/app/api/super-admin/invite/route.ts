import { NextResponse } from "next/server";
import { checkSuperAdminApi } from "@/lib/auth-guard";
import { db } from "@shopvendly/db/db";
import { verification } from "@shopvendly/db/schema";
import { eq } from "@shopvendly/db";
import crypto from "crypto";
import { sendSuperAdminInviteEmail } from "@shopvendly/transactional";

export async function POST(req: Request) {
    try {
        const authz = await checkSuperAdminApi(["super_admin"]);
        if ("error" in authz) {
            return NextResponse.json({ error: authz.error }, { status: authz.status });
        }

        const body = await req.json();
        const email = (body?.email as string | undefined)?.trim()?.toLowerCase();

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const identifier = `super_admin_invite:${email}`;

        await db.delete(verification).where(eq(verification.identifier, identifier));

        await db.insert(verification).values({
            id: crypto.randomUUID(),
            identifier,
            value: token,
            expiresAt,
        });

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:4000";
        const inviteUrl = `${baseUrl}/api/super-admin/invite/accept?token=${token}&email=${encodeURIComponent(email)}`;

        await sendSuperAdminInviteEmail({
            to: email,
            invitedByName: authz.session.user.name,
            inviteUrl,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Super admin invite error:", error);
        return NextResponse.json({ error: "Failed to send invite" }, { status: 500 });
    }
}
