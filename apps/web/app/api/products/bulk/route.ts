import { auth } from "@shopvendly/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getTenantMembership } from "@/features/dashboard/lib/tenant-membership";
import { db } from "@shopvendly/db/db";
import { products } from "@shopvendly/db/schema";
import { eq, inArray, and } from "@shopvendly/db";
import { z } from "zod";

const bulkUpdateSchema = z.object({
    // Allow strings, then filter to UUIDs to be lenient with temporary client IDs
    ids: z.array(z.string(), { message: "ids must be strings" }),
    action: z.enum(["publish", "archive", "delete"]),
});

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isUuid = (value: string) => uuidRegex.test(value);

export async function POST(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const membership = await getTenantMembership(session.user.id);

        if (!membership) {
            return NextResponse.json({ error: "No tenant found" }, { status: 404 });
        }

        const body = await request.json();
        const { ids, action } = bulkUpdateSchema.parse(body);

        const validIds = ids.filter(isUuid);
        if (validIds.length === 0) {
            return NextResponse.json({ count: 0, skipped: ids.length });
        }

        if (ids.length === 0) {
            return NextResponse.json({ count: 0 });
        }

        if (action === "publish") {
            await db.update(products)
                .set({ status: "active", updatedAt: new Date() })
                .where(and(
                    inArray(products.id, validIds),
                    eq(products.tenantId, membership.tenantId)
                ));
        } else if (action === "archive") {
            // Assuming we have an archive status? Or draft? Schema says: "draft", "ready", "active", "sold-out"
            // Let's use "draft" for now as archive equivalent or "sold-out" if specifically requested.
            // But typical "archive" usually means "draft" or soft delete.
            // Let's assume publish -> active.
            // For now only publish is requested.
            return NextResponse.json({ error: "Action not implemented" }, { status: 400 });
        } else if (action === "delete") {
            await db.update(products)
                .set({ deletedAt: new Date(), updatedAt: new Date() })
                .where(and(
                    inArray(products.id, validIds),
                    eq(products.tenantId, membership.tenantId)
                ));
        }

        return NextResponse.json({ success: true, count: validIds.length, skipped: ids.length - validIds.length });
    } catch (error) {
        console.error("Bulk update failed:", error);
        return NextResponse.json({ error: "Bulk update failed" }, { status: 500 });
    }
}
