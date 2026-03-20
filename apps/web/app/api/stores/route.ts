import { auth } from "@shopvendly/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { storeService } from "@/repo/store-repo";
import { tenantMembershipRepo } from "@/repo/tenant-membership-repo";
import { superAdminRepo } from "@/repo/super-admin-repo";
import { sendNewStoreAlertEmail } from "@shopvendly/transactional";
import { z } from "zod";

const createStoreSchema = z.object({
    name: z.string().min(1).max(255),
    slug: z.string().min(1).max(100),
    description: z.string().optional(),
    storeContactPhone: z.string().optional(),
    storeAddress: z.string().optional(),
    categories: z.array(z.string()).optional(),
});

/**
 * GET /api/stores
 * List stores for the authenticated seller
 */
export async function GET() {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const membership = await tenantMembershipRepo.findByUserId(session.user.id);

        if (!membership) {
            return NextResponse.json({ error: "No tenant found" }, { status: 404 });
        }

        const storeList = await storeService.findByTenantId(membership.tenantId);
        return NextResponse.json(storeList);
    } catch (error) {
        console.error("Error listing stores:", error);
        return NextResponse.json({ error: "Failed to list stores" }, { status: 500 });
    }
}

/**
 * POST /api/stores
 * Create a new store
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const membership = await tenantMembershipRepo.findByUserId(session.user.id);

        if (!membership) {
            return NextResponse.json({ error: "No tenant found" }, { status: 404 });
        }

        const body = await request.json();
        const input = createStoreSchema.parse(body);

        // Check if slug is unique
        const existing = await storeService.findBySlug(input.slug);
        if (existing) {
            return NextResponse.json({ error: "Store slug already exists" }, { status: 400 });
        }

        const store = await storeService.create({
            tenantId: membership.tenantId,
            status: true,
            ...input,
        });

        if (!store) {
            return NextResponse.json({ error: "Failed to create store" }, { status: 500 });
        }

        // Notify super admins asynchronously
        try {
            const adminRecords = await superAdminRepo.listNotificationRecipients();

            if (adminRecords.length > 0) {
                const adminStoreUrl = process.env.NEXT_PUBLIC_ADMIN_URL
                    ? `${process.env.NEXT_PUBLIC_ADMIN_URL}`
                    : `https://admin.shopvendly.store`;

                Promise.allSettled(adminRecords.map(admin =>
                    sendNewStoreAlertEmail({
                        to: admin.email,
                        storeName: store.name,
                        storeSlug: store.slug,
                        sellerName: session.user.name || "A Seller",
                        sellerEmail: session.user.email,
                        adminStoreUrl
                    })
                )).catch(err => console.error("Error in promise all settled for emails:", err));
            }
        } catch (emailError) {
            console.error("Failed to fetch super admins or send emails:", emailError);
        }

        return NextResponse.json(store, { status: 201 });
    } catch (error) {
        console.error("Error creating store:", error);
        return NextResponse.json({ error: "Failed to create store" }, { status: 500 });
    }
}
