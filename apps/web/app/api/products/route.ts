import { auth } from "@shopvendly/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { productService } from "@/features/products/lib/product-service";
import { getTenantMembership } from "@/features/dashboard/lib/tenant-membership";
import { productQuerySchema, createProductSchema } from "@/features/products/lib/product-models";
import { db } from "@shopvendly/db/db";
import { stores } from "@shopvendly/db/schema";
import { and, eq, isNull } from "@shopvendly/db";

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

        const membership = await getTenantMembership(session.user.id);

        if (!membership) {
            return NextResponse.json({ error: "No tenant found" }, { status: 404 });
        }

        const { searchParams } = new URL(request.url);
        const filters = productQuerySchema.parse({
            storeId: searchParams.get("storeId") || undefined,
            source: searchParams.get("source") || undefined,
            page: searchParams.get("page") || 1,
            limit: searchParams.get("limit") || 20,
            search: searchParams.get("search") || undefined,
        });

        const result = await productService.listProducts(membership.tenantId, filters);
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

        const membership = await getTenantMembership(session.user.id, { includeTenant: true });

        if (!membership || !membership.tenant) {
            return NextResponse.json({ error: "No tenant found" }, { status: 404 });
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

        let currency = input.currency;
        if (!currency) {
            const store = await db.query.stores.findFirst({
                where: and(eq(stores.id, input.storeId), eq(stores.tenantId, membership.tenantId), isNull(stores.deletedAt)),
                columns: { defaultCurrency: true },
            });
            currency = store?.defaultCurrency || "UGX";
        }

        const product = await productService.createProduct(
            membership.tenantId,
            membership.tenant.slug,
            { ...input, currency } as Parameters<typeof productService.createProduct>[2],
            files
        );

        // If specific media URLs were passed (client-side upload)
        if (input.media && input.media.length > 0) {
            await productService.attachMediaUrls(
                membership.tenantId,
                product.id,
                input.media
            );
            // Refresh product with media
            const productWithMedia = await productService.getProductWithMedia(product.id, membership.tenantId);
            return NextResponse.json(productWithMedia, { status: 201 });
        }

        return NextResponse.json(product, { status: 201 });
    } catch (error) {
        console.error("Error creating product:", error);
        return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
    }
}
