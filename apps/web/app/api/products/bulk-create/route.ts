import { z } from "zod";
import { revalidatePath, revalidateTag } from "next/cache";
import { productService } from "@/modules/products";
import { getTenantMembership, resolveTenantAdminAccessByStoreId } from "@/modules/admin";
import { tenantRepo } from "@/repo/tenant-repo";
import { storeRepo } from "@/repo/store-repo";
import { withApi } from "@/lib/api/with-api";
import { HttpError } from "@/lib/api/response-utils";
import { jsonSuccess } from "@/lib/api/response-utils";

const bulkCreateSchema = z.object({
    storeId: z.string(),
    items: z.array(z.object({
        url: z.string().url(),
        pathname: z.string(),
        contentType: z.string(),
        filename: z.string(),
    })),
});

const generateDraftSlug = () => {
    const timestamp = Date.now().toString(36);
    const shortId = Math.random().toString(36).substring(2, 8);
    return `draft-${timestamp}-${shortId}`;
};

export const POST = withApi({ schema: bulkCreateSchema }, async ({ session, body }) => {
    const { storeId, items } = body;

    const access = await resolveTenantAdminAccessByStoreId(session.user.id, storeId, "write");
    if (!access.store) throw new HttpError("Store not found", 404);
    if (!access.isAuthorized) throw new HttpError("Forbidden", 403);

    const tenantId = access.store.tenantId;
    const membership = await getTenantMembership(session.user.id, { tenantId, includeTenant: true });

    let tenantSlug = membership?.tenant?.slug;
    if (!tenantSlug && access.isSuperAdmin) {
        const tenant = await tenantRepo.findSlugById(tenantId);
        tenantSlug = tenant?.slug;
    }
    if (!tenantSlug) throw new HttpError("No tenant found", 404);

    const store = await storeRepo.findByIdAndTenant(storeId, tenantId);
    if (!store) throw new HttpError("Store not found", 404);

    const createdProducts = await Promise.all(
        items.map(async (item) =>
            productService.createProduct(
                tenantId,
                tenantSlug,
                {
                    storeId,
                    productName: "Draft",
                    description: "",
                    priceAmount: 0,
                    quantity: 0,
                    currency: store.defaultCurrency || "UGX",
                    status: "draft",
                    source: "bulk-upload",
                    slug: generateDraftSlug(),
                },
                [],
            ).then(async (product) => {
                await productService.attachMediaUrls(tenantId, product.id, [
                    { url: item.url, pathname: item.pathname, contentType: item.contentType },
                ]);
                return product;
            }),
        ),
    );

    if (store.slug) {
        revalidateTag(`storefront:store:${store.slug}:products`, "default");
        revalidatePath(`/${store.slug}`, "page");
    }

    return jsonSuccess({ count: createdProducts.length, products: createdProducts });
});
