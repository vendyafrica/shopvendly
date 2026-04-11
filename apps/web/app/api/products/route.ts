import { NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@shopvendly/auth";
import { headers } from "next/headers";
import { revalidatePath, revalidateTag } from "next/cache";
import { productService } from "@/modules/products";
import { getTenantMembership, resolveTenantAdminAccessByStoreId } from "@/modules/admin";
import { productQuerySchema, createProductSchema } from "@/modules/products/lib/product-models";
import { tenantRepo } from "@/repo/tenant-repo";
import { storeRepo } from "@/repo/store-repo";
import { withApi } from "@/lib/api/with-api";
import { jsonSuccess, jsonError, HttpError, isDemoStore, getOptionalSession } from "@/lib/api/response-utils";

/**
 * GET /api/products
 * List products for the authenticated seller (or demo store)
 */
// Has demo-store logic so cannot use withApi({ auth: true })
export async function GET(request: NextRequest) {
    try {
        const session = await getOptionalSession(request);
        const { searchParams } = new URL(request.url);
        const storeId = searchParams.get("storeId") || undefined;

        if (!storeId) return jsonError("Missing storeId", 400);

        const store = await storeRepo.findById(storeId);
        if (!store) return jsonError("Store not found", 404);

        if (!session?.user && !isDemoStore(store.slug)) return jsonError("Unauthorized", 401);

        const filters = productQuerySchema.parse({
            storeId,
            source: searchParams.get("source") || undefined,
            page: searchParams.get("page") || 1,
            limit: searchParams.get("limit") || 1000,
            search: searchParams.get("search") || undefined,
        });

        let tenantId: string;

        if (session?.user) {
            const access = await resolveTenantAdminAccessByStoreId(session.user.id, storeId, "read");
            if (!access.store) return jsonError("Store not found", 404);
            if (!access.isAuthorized) return jsonError("Forbidden", 403);
            tenantId = access.store.tenantId;
        } else {
            tenantId = store.tenantId;
        }

        const result = await productService.listProducts(tenantId, filters);
        return jsonSuccess(result);
    } catch (error) {
        console.error("Error listing products:", error);
        return jsonError("Failed to list products", 500);
    }
}

/**
 * POST /api/products
 * Create a new product (JSON or multipart/form-data)
 */
// Has multipart form parsing which withApi doesn't support, so stays as a function
export async function POST(request: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) return jsonError("Unauthorized", 401);

        const contentType = request.headers.get("content-type") || "";
        let input: z.infer<typeof createProductSchema>;
        const files: Array<{ buffer: Buffer; originalname: string; mimetype: string }> = [];

        if (contentType.includes("multipart/form-data")) {
            const formData = await request.formData();
            input = createProductSchema.parse({
                storeId: formData.get("storeId"),
                productName: formData.get("productName"),
                description: formData.get("description") || undefined,
                priceAmount: Number(formData.get("priceAmount")) || 0,
                currency: formData.get("currency") || undefined,
                quantity: Number(formData.get("quantity")) || 0,
            });
            for (const entry of formData.getAll("files")) {
                if (entry instanceof File) {
                    files.push({
                        buffer: Buffer.from(await entry.arrayBuffer()),
                        originalname: entry.name,
                        mimetype: entry.type,
                    });
                }
            }
        } else {
            input = createProductSchema.parse(await request.json());
        }

        const access = await resolveTenantAdminAccessByStoreId(session.user.id, input.storeId, "write");
        if (!access.store) return jsonError("Store not found", 404);
        if (!access.isAuthorized) return jsonError("Forbidden", 403);

        const membership = await getTenantMembership(session.user.id, {
            tenantId: access.store.tenantId,
            includeTenant: true,
        });

        let tenantSlug = membership?.tenant?.slug;
        if (!tenantSlug && access.isSuperAdmin) {
            const tenant = await tenantRepo.findSlugById(access.store.tenantId);
            tenantSlug = tenant?.slug;
        }

        if (!tenantSlug) return jsonError("No tenant found", 404);

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
            files,
        );

        if (storeSlug) {
            revalidateTag(`storefront:store:${storeSlug}:products`, "default");
            revalidatePath(`/${storeSlug}`, "page");
        }

        if (input.media && input.media.length > 0) {
            await productService.attachMediaUrls(access.store.tenantId, product.id, input.media);
            const productWithMedia = await productService.getProductWithMedia(product.id, access.store.tenantId);
            return jsonSuccess(productWithMedia, { status: 201 });
        }

        return jsonSuccess(product, { status: 201 });
    } catch (error) {
        console.error("Error creating product:", error);
        return jsonError("Failed to create product", 500);
    }
}
