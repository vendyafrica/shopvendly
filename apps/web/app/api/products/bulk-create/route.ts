import { auth } from "@shopvendly/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { productService } from "@/features/products/lib/product-service";
import { getTenantMembership } from "@/app/admin/lib/tenant-membership";
import { resolveTenantAdminAccessByStoreId } from "@/app/admin/lib/admin-access";
import { db } from "@shopvendly/db/db";
import { stores, tenants } from "@shopvendly/db/schema";
import { eq, and, isNull } from "@shopvendly/db";
import { revalidateTag, revalidatePath } from "next/cache";
import { z } from "zod";

const bulkCreateSchema = z.object({
    storeId: z.string(),
    items: z.array(z.object({
        url: z.string().url(),
        pathname: z.string(),
        contentType: z.string(),
        filename: z.string(),
    })),
});

export async function POST(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { storeId, items } = bulkCreateSchema.parse(body);

        const access = await resolveTenantAdminAccessByStoreId(session.user.id, storeId, "write");
        if (!access.store) {
            return NextResponse.json({ error: "Store not found" }, { status: 404 });
        }

        if (!access.isAuthorized) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const membership = await getTenantMembership(session.user.id, {
            tenantId: access.store.tenantId,
            includeTenant: true,
        });

        const tenantId = access.store.tenantId;
        let tenantSlug = membership?.tenant?.slug;
        if (!tenantSlug && access.isSuperAdmin) {
            const tenant = await db.query.tenants.findFirst({
                where: eq(tenants.id, tenantId),
                columns: { slug: true },
            });
            tenantSlug = tenant?.slug;
        }

        if (!tenantSlug) {
            return NextResponse.json({ error: "No tenant found" }, { status: 404 });
        }

        const store = await db.query.stores.findFirst({
            where: and(eq(stores.id, storeId), eq(stores.tenantId, tenantId), isNull(stores.deletedAt)),
            columns: { defaultCurrency: true, slug: true },
        });

        if (!store) {
            return NextResponse.json({ error: "Store not found" }, { status: 404 });
        }

        // Helper to generate a unique draft slug
        const generateDraftSlug = () => {
            const timestamp = Date.now().toString(36); // base36 timestamp
            const shortId = Math.random().toString(36).substring(2, 8); // 6-char random
            return `draft-${timestamp}-${shortId}`;
        };

        // Process sequentially or in parallel? Parallel is fine for DB inserts usually.
        const createdProducts = await Promise.all(items.map(async (item) => {
            // Dummy title for bulk-upload drafts
            const title = "Draft";

            return productService.createProduct(
                tenantId,
                tenantSlug,
                {
                    storeId,
                    title,
                    description: "", // Empty for now, user can edit later
                    priceAmount: 0,
                    quantity: 0,
                    currency: store.defaultCurrency || "UGX",
                    status: "draft",
                    source: "bulk-upload",
                    slug: generateDraftSlug(), // Guaranteed-unique slug
                },
                [], // No "files" to upload, we pass media directly
            ).then(async (product) => {
                // Attach media
                await productService.attachMediaUrls(
                    tenantId,
                    product.id,
                    [{ url: item.url, pathname: item.pathname, contentType: item.contentType }]
                );
                return product;
            });
        }));

        if (store.slug) {
            revalidateTag(`storefront:store:${store.slug}:products`);
            revalidatePath(`/${store.slug}`);
        }

        return NextResponse.json({ count: createdProducts.length, products: createdProducts });
    } catch (error) {
        console.error("Bulk create failed:", error);
        return NextResponse.json({ error: "Bulk create failed" }, { status: 500 });
    }
}
