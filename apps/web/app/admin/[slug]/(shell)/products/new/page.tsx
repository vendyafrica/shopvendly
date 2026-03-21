"use client";

import * as React from "react";
import { ProductForm } from "../components/product-form";
import { useTenant } from "@/modules/admin/context/tenant-context";

export default function NewProductPage() {
    const { bootstrap } = useTenant();

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
                tenantId={bootstrap.tenantId} 
                storeId={bootstrap.storeId} 
            />
        </div>
    );
}
