"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { ProductForm } from "../components/product-form";
import { useTenant } from "@/modules/admin/context/tenant-context";
import { useProductDetail } from "@/modules/products/hooks/use-products";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading03Icon } from "@hugeicons/core-free-icons";

import { ProductFormSkeleton } from "@/shared/components/ui/page-skeletons";

export default function EditProductPage() {
    const params = useParams();
    const id = params.id as string;
    const { bootstrap } = useTenant();
    const { data: product, isLoading, error } = useProductDetail(id);
    const isReadOnly = Boolean(bootstrap?.storeSlug === "vendly" && !bootstrap?.canWrite);

    if (isLoading) {
        return (
            <div className="container py-6">
                <ProductFormSkeleton />
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <p className="text-destructive font-medium">Failed to load product. It might have been deleted.</p>
            </div>
        );
    }

    if (!bootstrap?.tenantId || !bootstrap?.storeId) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <p className="text-muted-foreground">Store context not found. Please refresh.</p>
            </div>
        );
    }

    return (
        <div className="container py-6">
            <ProductForm 
                isEditing
                initialData={product}
                tenantId={bootstrap.tenantId} 
                storeId={bootstrap.storeId}
                readOnly={isReadOnly}
            />
        </div>
    );
}
