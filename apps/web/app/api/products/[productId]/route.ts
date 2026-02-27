import { auth } from "@shopvendly/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { productService } from "@/features/products/lib/product-service";
import { getTenantMembership } from "@/features/dashboard/lib/tenant-membership";
import { updateProductSchema } from "@/features/products/lib/product-models";

type RouteParams = {
    params: Promise<{ productId: string }>;
};

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

        const membership = await getTenantMembership(session.user.id);

        if (!membership) {
            return NextResponse.json({ error: "No tenant found" }, { status: 404 });
        }

        const { productId } = await params;
        const product = await productService.getProductWithMedia(productId, membership.tenantId);

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

        const membership = await getTenantMembership(session.user.id);

        if (!membership) {
            return NextResponse.json({ error: "No tenant found" }, { status: 404 });
        }

        const { productId } = await params;
        const body = await request.json();
        const input = updateProductSchema.parse(body);

        // Check for media updates (not part of updateProductSchema currently)
        const mediaInput = body.media ? body.media : undefined;

        // Update product method should be enhanced to handle media syncing
        // For now, we manually handle it here or update the service.
        // Let's update the service to handle optional "media" in updateProduct.
        // But first let's pass it.
        const updated = await productService.updateProduct(productId, membership.tenantId, { ...input, media: mediaInput });
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

        const membership = await getTenantMembership(session.user.id, { includeTenant: true });

        if (!membership || !membership.tenant) {
            return NextResponse.json({ error: "No tenant found" }, { status: 404 });
        }

        const { productId } = await params;
        await productService.deleteProduct(productId, membership.tenantId);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting product:", error);

        if (error instanceof Error && error.message === "Product not found") {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
    }
}
