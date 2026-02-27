import { db } from "@shopvendly/db/db";
import { tenants } from "@shopvendly/db/schema";
import { eq } from "@shopvendly/db";
import { NextResponse } from "next/server";
import { checkSuperAdminApi } from "@/lib/auth-guard";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await checkSuperAdminApi(["super_admin"]);
    if (auth.error) {
        return NextResponse.json(auth, { status: auth.status });
    }

    const { id } = await params;

    try {
        const tenant = await db.query.tenants.findFirst({
            where: eq(tenants.id, id),
            with: {
                memberships: {
                    with: {
                        user: true,
                    },
                },
            },
        });

        if (!tenant) {
            return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
        }

        return NextResponse.json(tenant);
    } catch (error) {
        console.error("Tenant Detail API Error:", error);
        return NextResponse.json({ error: "Failed to fetch tenant" }, { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await checkSuperAdminApi(["super_admin"]);
    if (auth.error) {
        return NextResponse.json(auth, { status: auth.status });
    }

    const { id } = await params;
    const body = await req.json();
    const { status, plan } = body;

    try {
        await db
            .update(tenants)
            .set({
                ...(status ? { status } : {}),
                ...(plan ? { plan } : {}),
            })
            .where(eq(tenants.id, id));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Update Tenant API Error:", error);
        return NextResponse.json({ error: "Failed to update tenant" }, { status: 500 });
    }
}
