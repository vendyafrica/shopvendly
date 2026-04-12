import { revalidatePath, revalidateTag } from "next/cache";
import { productService } from "@/modules/products";
import { resolveTenantAdminAccessByStoreId } from "@/modules/admin";
import { updateProductSchema } from "@/modules/products/services/product-models";
import { productRepo } from "@/modules/products/repo/product-repo";
import { storeRepo } from "@/modules/storefront/repo/store-repo";
import { withApi } from "@/shared/lib/api/with-api";
import { jsonSuccess, HttpError } from "@/shared/lib/api/response-utils";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type ProductRouteParams = { productId: string };

/**
 * GET /api/products/[productId]
 * Get a single product by ID
 */
export const GET = withApi<undefined, ProductRouteParams>(
  {},
  async ({ session, params }) => {
    const { productId } = params;
    if (!UUID_REGEX.test(productId))
      throw new HttpError("Invalid product id", 400);

    const scope = await productRepo.findScopeById(productId);
    if (!scope) throw new HttpError("Product not found", 404);

    const access = await resolveTenantAdminAccessByStoreId(
      session.user.id,
      scope.storeId,
      "read",
    );
    if (!access.store) throw new HttpError("Store not found", 404);
    if (!access.isAuthorized) throw new HttpError("Forbidden", 403);

    const product = await productService.getProductWithMedia(
      productId,
      scope.tenantId,
    );
    return jsonSuccess(product);
  },
);

/**
 * PATCH /api/products/[productId]
 * Update a product
 */
export const PATCH = withApi<undefined, ProductRouteParams>(
  {},
  async ({ req, session, params }) => {
    const { productId } = params;
    if (!UUID_REGEX.test(productId))
      throw new HttpError("Invalid product id", 400);

    const scope = await productRepo.findScopeById(productId);
    if (!scope) throw new HttpError("Product not found", 404);

    const access = await resolveTenantAdminAccessByStoreId(
      session.user.id,
      scope.storeId,
      "write",
    );
    if (!access.store) throw new HttpError("Store not found", 404);
    if (!access.isAuthorized) throw new HttpError("Forbidden", 403);

    const body: unknown = await req.json();
    const input = updateProductSchema.parse(body);
    const mediaInput = (body as Record<string, unknown>).media ?? undefined;

    const updated = await productService.updateProduct(
      productId,
      scope.tenantId,
      {
        ...input,
        media: mediaInput as Parameters<
          typeof productService.updateProduct
        >[2]["media"],
      },
    );

    const store = await storeRepo.findByIdAndTenant(
      scope.storeId,
      scope.tenantId,
    );
    if (store?.slug) {
      revalidateTag(`storefront:store:${store.slug}`, "default");
      revalidateTag(`storefront:store:${store.slug}:products`, "default");
      revalidatePath(`/${store.slug}`, "page");
      if (updated.slug) {
        revalidateTag(
          `storefront:store:${store.slug}:product:${updated.slug}`,
          "default",
        );
        revalidatePath(`/${store.slug}/${updated.slug}`, "page");
      }
    }

    return jsonSuccess(updated);
  },
);

/**
 * DELETE /api/products/[productId]
 * Delete a product
 */
export const DELETE = withApi<undefined, ProductRouteParams>(
  {},
  async ({ session, params }) => {
    const { productId } = params;
    if (!UUID_REGEX.test(productId))
      throw new HttpError("Invalid product id", 400);

    const scope = await productRepo.findScopeById(productId);
    if (!scope) throw new HttpError("Product not found", 404);

    const access = await resolveTenantAdminAccessByStoreId(
      session.user.id,
      scope.storeId,
      "write",
    );
    if (!access.store) throw new HttpError("Store not found", 404);
    if (!access.isAuthorized) throw new HttpError("Forbidden", 403);

    const deleted = await productService.deleteProduct(
      productId,
      scope.tenantId,
    );

    const store = await storeRepo.findByIdAndTenant(
      scope.storeId,
      scope.tenantId,
    );
    if (store?.slug) {
      revalidateTag(`storefront:store:${store.slug}`, "default");
      revalidateTag(`storefront:store:${store.slug}:products`, "default");
      revalidatePath(`/${store.slug}`, "page");
      if (deleted?.slug) {
        revalidateTag(
          `storefront:store:${store.slug}:product:${deleted.slug}`,
          "default",
        );
        revalidatePath(`/${store.slug}/${deleted.slug}`, "page");
      }
    }

    return jsonSuccess({ success: true });
  },
);
