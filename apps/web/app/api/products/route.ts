import { auth } from "@shopvendly/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { productService } from "@/modules/products";
import { getTenantMembership } from "@/modules/admin";
import { resolveTenantAdminAccessByStoreId } from "@/modules/admin";
import { productQuerySchema, createProductSchema } from "@/features/products/lib/product-models";
import { tenantRepo } from "@/repo/tenant-repo";
import { storeRepo } from "@/repo/store-repo";
import { revalidateTag, revalidatePath } from "next/cache";

/**
 * GET /api/products
 * List products for the authenticated seller
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const storeId = searchParams.get("storeId") || undefined;
        const filters = productQuerySchema.parse({
            storeId,
            source: searchParams.get("source") || undefined,
            page: searchParams.get("page") || 1,
            limit: searchParams.get("limit") || 1000,
            search: searchParams.get("search") || undefined,
        });

        let tenantId: string;

        if (storeId) {
            const access = await resolveTenantAdminAccessByStoreId(session.user.id, storeId, "read");

            if (!access.store) {
                return NextResponse.json({ error: "Store not found" }, { status: 404 });
            }

            if (!access.isAuthorized) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }

            tenantId = access.store.tenantId;
        } else {
            const membership = await getTenantMembership(session.user.id);

            if (!membership) {
                return NextResponse.json({ error: "No tenant found" }, { status: 404 });
            }

            tenantId = membership.tenantId;
        }

        const result = await productService.listProducts(tenantId, filters);
        return NextResponse.json(result);
    } catch (error) {
        console.error("Error listing products:", error);
        return NextResponse.json({ error: "Failed to list products" }, { status: 500 });
    }
}

/**
 * POST /api/products
 * Create a new product (form data with optional files)
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if it's multipart form data or JSON
        const contentType = request.headers.get("content-type") || "";

        let input: z.infer<typeof createProductSchema>;
        const files: Array<{ buffer: Buffer; originalname: string; mimetype: string }> = [];

        if (contentType.includes("multipart/form-data")) {
            const formData = await request.formData();

            input = createProductSchema.parse({
                storeId: formData.get("storeId"),
                title: formData.get("title"),
                description: formData.get("description") || undefined,
                priceAmount: Number(formData.get("priceAmount")) || 0,
                currency: formData.get("currency") || undefined,
                quantity: Number(formData.get("quantity")) || 0,
            });

            // Get files
            const fileEntries = formData.getAll("files");
            for (const entry of fileEntries) {
                if (entry instanceof File) {
                    const buffer = Buffer.from(await entry.arrayBuffer());
                    files.push({
                        buffer,
                        originalname: entry.name,
                        mimetype: entry.type,
                    });
                }
            }
        } else {
            const body: unknown = await request.json();
            input = createProductSchema.parse(body);
        }

        const access = await resolveTenantAdminAccessByStoreId(session.user.id, input.storeId, "write");

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

        let tenantSlug = membership?.tenant?.slug;
        if (!tenantSlug && access.isSuperAdmin) {
            const tenant = await tenantRepo.findSlugById(access.store.tenantId);
            tenantSlug = tenant?.slug;
        }

        if (!tenantSlug) {
            return NextResponse.json({ error: "No tenant found" }, { status: 404 });
        }

        let currency = input.currency;
        let storeSlug: string | undefined;
        if (!currency || !storeSlug) {
            const store = await storeRepo.findByIdAndTenant(input.storeId, access.store.tenantId);
            currency = currency || store?.defaultCurrency || "UGX";
            storeSlug = store?.slug;
        }

        const product = await productService.createProduct(
            access.store.tenantId,
            tenantSlug,
            { ...input, currency } as Parameters<typeof productService.createProduct>[2],
            files
        );

        if (storeSlug) {
            revalidateTag(`storefront:store:${storeSlug}:products`, "default");
            revalidatePath(`/${storeSlug}`, "page");
        }

        // If specific media URLs were passed (client-side upload)
        if (input.media && input.media.length > 0) {
            await productService.attachMediaUrls(
                access.store.tenantId,
                product.id,
                input.media
            );
            // Refresh product with media
            const productWithMedia = await productService.getProductWithMedia(product.id, access.store.tenantId);
            return NextResponse.json(productWithMedia, { status: 201 });
        }

        return NextResponse.json(product, { status: 201 });
    } catch (error) {
        console.error("Error creating product:", error);
        return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
    }
}
