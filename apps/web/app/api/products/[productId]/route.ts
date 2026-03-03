import { auth } from "@shopvendly/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { productService } from "@/features/products/lib/product-service";
import { resolveTenantAdminAccessByStoreId } from "@/app/admin/lib/admin-access";
import { updateProductSchema } from "@/features/products/lib/product-models";
import { db } from "@shopvendly/db/db";
import { products } from "@shopvendly/db/schema";
import { and, eq, isNull } from "@shopvendly/db";

type RouteParams = {
    params: Promise<{ productId: string }>;
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function resolveProductScope(productId: string) {
    return db.query.products.findFirst({
        where: and(eq(products.id, productId), isNull(products.deletedAt)),
        columns: {
            id: true,
            storeId: true,
            tenantId: true,
        },
    });
}

/**
 * GET /api/products/[productId]
 * Get a single product by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { productId } = await params;

        if (!UUID_REGEX.test(productId)) {
            return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
        }

        const scope = await resolveProductScope(productId);
        if (!scope) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        const access = await resolveTenantAdminAccessByStoreId(session.user.id, scope.storeId, "read");
        if (!access.store) {
            return NextResponse.json({ error: "Store not found" }, { status: 404 });
        }

        if (!access.isAuthorized) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const product = await productService.getProductWithMedia(productId, scope.tenantId);

        return NextResponse.json(product);
    } catch (error) {
        console.error("Error fetching product:", error);

        if (error instanceof Error && error.message === "Product not found") {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
    }
}

/**
 * PATCH /api/products/[productId]
 * Update a product
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { productId } = await params;

        if (!UUID_REGEX.test(productId)) {
            return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
        }

        const scope = await resolveProductScope(productId);
        if (!scope) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        const access = await resolveTenantAdminAccessByStoreId(session.user.id, scope.storeId, "write");
        if (!access.store) {
            return NextResponse.json({ error: "Store not found" }, { status: 404 });
        }

        if (!access.isAuthorized) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const input = updateProductSchema.parse(body);

        // Check for media updates (not part of updateProductSchema currently)
        const mediaInput = body.media ? body.media : undefined;

        // Update product method should be enhanced to handle media syncing
        // For now, we manually handle it here or update the service.
        // Let's update the service to handle optional "media" in updateProduct.
        // But first let's pass it.
        const updated = await productService.updateProduct(productId, scope.tenantId, { ...input, media: mediaInput });
        return NextResponse.json(updated);
    } catch (error) {
        console.error("Error updating product:", error);

        if (error instanceof Error && error.message === "Product not found") {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
    }
}

/**
 * DELETE /api/products/[productId]
 * Delete a product
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { productId } = await params;

        if (!UUID_REGEX.test(productId)) {
            return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
        }

        const scope = await resolveProductScope(productId);
        if (!scope) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        const access = await resolveTenantAdminAccessByStoreId(session.user.id, scope.storeId, "write");
        if (!access.store) {
            return NextResponse.json({ error: "Store not found" }, { status: 404 });
        }

        if (!access.isAuthorized) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await productService.deleteProduct(productId, scope.tenantId);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting product:", error);

        if (error instanceof Error && error.message === "Product not found") {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
    }
}
