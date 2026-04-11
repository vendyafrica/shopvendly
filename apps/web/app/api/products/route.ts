import { z } from "zod";
import { revalidatePath, revalidateTag } from "next/cache";
import { productService } from "@/modules/products";
import { getTenantMembership, resolveTenantAdminAccessByStoreId } from "@/modules/admin";
import { productQuerySchema, createProductSchema } from "@/modules/products/lib/product-models";
import { tenantRepo } from "@/repo/tenant-repo";
import { storeRepo } from "@/repo/store-repo";
import { withApi } from "@/lib/api/with-api";
import { jsonSuccess, HttpError, isDemoStore } from "@/lib/api/response-utils";

/**
 * GET /api/products
 * List products for the authenticated seller (or demo store)
 */
export const GET = withApi({ auth: false }, async ({ req, session }) => {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("storeId") || undefined;

    if (!storeId) throw new HttpError("Missing storeId", 400);

    const store = await storeRepo.findById(storeId);
    if (!store) throw new HttpError("Store not found", 404);

    if (!session?.user && !isDemoStore(store.slug)) throw new HttpError("Unauthorized", 401);

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
        if (!access.store) throw new HttpError("Store not found", 404);
        if (!access.isAuthorized) throw new HttpError("Forbidden", 403);
        tenantId = access.store.tenantId;
    } else {
        tenantId = store.tenantId;
    }

    const result = await productService.listProducts(tenantId, filters);
    return jsonSuccess(result);
});

/**
 * POST /api/products
 * Create a new product (JSON or multipart/form-data)
 * Body parsing is manual here because multipart/form-data requires formData() not req.json()
 */
export const POST = withApi({ auth: true }, async ({ req, session }) => {
    const contentType = req.headers.get("content-type") || "";
    let input: z.infer<typeof createProductSchema>;
    const files: Array<{ buffer: Buffer; originalname: string; mimetype: string }> = [];

    if (contentType.includes("multipart/form-data")) {
        const formData = await req.formData();
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
        input = createProductSchema.parse(await req.json());
    }

    const access = await resolveTenantAdminAccessByStoreId(session.user.id, input.storeId, "write");
    if (!access.store) throw new HttpError("Store not found", 404);
    if (!access.isAuthorized) throw new HttpError("Forbidden", 403);

    const membership = await getTenantMembership(session.user.id, {
        tenantId: access.store.tenantId,
        includeTenant: true,
    });

    let tenantSlug = membership?.tenant?.slug;
    if (!tenantSlug && access.isSuperAdmin) {
        const tenant = await tenantRepo.findSlugById(access.store.tenantId);
        tenantSlug = tenant?.slug;
    }

    if (!tenantSlug) throw new HttpError("No tenant found", 404);

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
});
