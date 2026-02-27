"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";

// Types
type ProductMediaItem = {
    blobUrl: string;
    blobPathname?: string | null;
    contentType?: string | null;
};

export type ProductApiRow = {
    id: string;
    storeId: string;
    productName: string;
    slug: string;
    description?: string | null;
    priceAmount: number;
    currency: string;
    quantity: number;
    status: "draft" | "ready" | "active" | "sold-out";
    media: ProductMediaItem[];
    salesAmount?: number;
};

export type ProductTableRow = {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    priceAmount: number;
    currency: string;
    quantity: number;
    status: "draft" | "ready" | "active" | "sold-out";
    thumbnailUrl?: string;
    thumbnailType?: string;
    salesAmount?: number;
};

// API functions
async function fetchProducts(storeId: string): Promise<ProductTableRow[]> {
    const res = await fetch(`/api/products?storeId=${storeId}`, {
        cache: "no-store",
        headers: {
            "Pragma": "no-cache",
            "Cache-Control": "no-cache"
        }
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to load products");
    }

    const data = (await res.json()) as { products: ProductApiRow[] };
    return (data.products || []).map((p) => ({
        id: p.id,
        name: p.productName,
        slug: p.slug,
        description: p.description,
        priceAmount: p.priceAmount,
        currency: p.currency,
        quantity: p.quantity,
        status: p.status,
        thumbnailUrl: p.media?.[0]?.blobUrl,
        thumbnailType: p.media?.[0]?.contentType || undefined,
        salesAmount: p.salesAmount ?? 0,
    }));
}

async function fetchProductDetail(id: string): Promise<ProductApiRow> {
    const res = await fetch(`/api/products/${id}`);
    if (!res.ok) {
        throw new Error("Failed to load product");
    }
    return res.json();
}

async function deleteProduct(id: string): Promise<void> {
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (!res.ok) {
        throw new Error("Failed to delete product");
    }
}

async function updateProduct(
    id: string,
    data: Partial<ProductApiRow>
): Promise<ProductApiRow> {
    const res = await fetch(`/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        throw new Error("Failed to update product");
    }
    return res.json();
}

// Hooks

/**
 * Hook to fetch products for a store
 */
export function useProducts(storeId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.products.list(storeId ?? ""),
        queryFn: () => fetchProducts(storeId!),
        enabled: !!storeId,
    });
}

/**
 * Hook to fetch a single product detail
 */
export function useProductDetail(id: string | undefined) {
    return useQuery({
        queryKey: queryKeys.products.detail(id ?? ""),
        queryFn: () => fetchProductDetail(id!),
        enabled: !!id,
    });
}

/**
 * Hook for deleting a product with optimistic updates
 */
export function useDeleteProduct(storeId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteProduct,

        // Optimistic update: remove the product from the list immediately
        onMutate: async (productId: string) => {
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({
                queryKey: queryKeys.products.list(storeId),
            });

            // Snapshot the previous value
            const previousProducts = queryClient.getQueryData<ProductTableRow[]>(
                queryKeys.products.list(storeId)
            );

            // Optimistically update the cache
            queryClient.setQueryData<ProductTableRow[]>(
                queryKeys.products.list(storeId),
                (old) => old?.filter((p) => p.id !== productId) ?? []
            );

            // Return context with the snapshot
            return { previousProducts };
        },

        // If mutation fails, rollback to the previous value
        onError: (_error, _productId, context) => {
            if (context?.previousProducts) {
                queryClient.setQueryData(
                    queryKeys.products.list(storeId),
                    context.previousProducts
                );
            }
        },

        // Always refetch after error or success to sync with server
        onSettled: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.products.list(storeId),
            });
        },
    });
}

/**
 * Hook for updating a product with optimistic updates
 */
export function useUpdateProduct(storeId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<ProductApiRow> }) =>
            updateProduct(id, data),

        // Optimistic update: update the product in the list immediately
        onMutate: async ({ id, data }) => {
            await queryClient.cancelQueries({
                queryKey: queryKeys.products.list(storeId),
            });

            const previousProducts = queryClient.getQueryData<ProductTableRow[]>(
                queryKeys.products.list(storeId)
            );

            // Optimistically update
            queryClient.setQueryData<ProductTableRow[]>(
                queryKeys.products.list(storeId),
                (old) =>
                    old?.map((p) =>
                        p.id === id
                            ? {
                                ...p,
                                name: data.productName ?? p.name,
                                priceAmount: data.priceAmount ?? p.priceAmount,
                                quantity: data.quantity ?? p.quantity,
                                status: data.status ?? p.status,
                            }
                            : p
                    ) ?? []
            );

            return { previousProducts };
        },

        onError: (_error, _variables, context) => {
            if (context?.previousProducts) {
                queryClient.setQueryData(
                    queryKeys.products.list(storeId),
                    context.previousProducts
                );
            }
        },

        onSettled: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.products.list(storeId),
            });
        },
    });
}

/**
 * Hook to invalidate products cache (useful after uploads)
 */
export function useInvalidateProducts() {
    const queryClient = useQueryClient();

    return {
        invalidate: (storeId: string) =>
            queryClient.invalidateQueries({
                queryKey: queryKeys.products.list(storeId),
            }),
        invalidateAll: () =>
            queryClient.invalidateQueries({
                queryKey: queryKeys.products.all,
            }),
    };
}
