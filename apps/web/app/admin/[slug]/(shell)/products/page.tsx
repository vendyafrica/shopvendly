"use client";

import * as React from "react";
import { SegmentedStatsCard } from "@/app/admin/components/segmented-stats-card";
import { DataTable } from "@/app/admin/components/data-table";

import type { ColumnDef } from "@tanstack/react-table";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { AddProductButton } from "./components/add-product-button";
import { useTenant } from "@/app/admin/context/tenant-context";
import { useSearchParams } from "next/navigation";

import Image from "next/image";
import { Button } from "@shopvendly/ui/components/button";
import { Input } from "@shopvendly/ui/components/input";
import { HugeiconsIcon } from "@hugeicons/react";
import { SparklesIcon, Loading03Icon, Delete02Icon, Edit02Icon } from "@hugeicons/core-free-icons";

import { UploadModal } from "./components/upload-modal";
import { EditProductModal } from "./components/edit-product-modal";
import { ProductsMobileView } from "./components/products-mobile-view";
import { Checkbox } from "@shopvendly/ui/components/checkbox";
import {
  useProducts,
  useDeleteProduct,
  useInvalidateProducts,
  useUpdateProduct,
  type ProductTableRow,
  type ProductApiRow,
} from "@/features/products/hooks/use-products";
import { ProductsPageSkeleton } from "@/components/ui/page-skeletons";
import { isLikelyVideoMedia } from "@/utils/misc";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type EditableField = "name" | "priceAmount" | "quantity";
type DraftMap = Record<string, Partial<Record<EditableField, string>>>;

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

function ProductThumbnail({
  url,
  name,
  contentType,
}: {
  url?: string;
  name: string;
  contentType?: string;
}) {
  const [forceVideo, setForceVideo] = React.useState(false);

  if (!url) {
    return <div className="flex size-full items-center justify-center text-xs text-muted-foreground">N/A</div>;
  }

  const isVideo = forceVideo || isLikelyVideoMedia({ url, contentType });

  if (isVideo) {
    return (
      <video
        src={url}
        className="h-full w-full object-cover bg-muted/30"
        muted
        playsInline
        loop
        autoPlay
        preload="none"
        poster=""
      />
    );
  }

  return (
    <Image
      src={url}
      alt={name}
      fill
      className="object-cover bg-muted/30"
      unoptimized={url.includes(".ufs.sh")}
      onError={() => setForceVideo(true)}
      loading="eager"
    />
  );
}

export default function ProductsPage() {
  const { bootstrap, error: bootstrapError } = useTenant();
  const searchParams = useSearchParams();

  const queryClient = useQueryClient();

  // Use React Query for products with optimistic updates
  const {
    data: rows = [],
    isLoading,
    error: queryError,
    refetch,
  } = useProducts(bootstrap?.storeId);

  const deleteProduct = useDeleteProduct(bootstrap?.storeId ?? "");
  const { invalidate } = useInvalidateProducts();

  const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({});
  const [isPublishing, setIsPublishing] = React.useState(false);

  const [uploadModalOpen, setUploadModalOpen] = React.useState(false);
  const [editModalOpen, setEditModalOpen] = React.useState(false);
  // Type compatible with EditProductModal's Product interface
  const [editingProduct, setEditingProduct] = React.useState<{
    id: string;
    productName: string;
    description?: string;
    priceAmount: number;
    currency: string;
    quantity: number;
    status: string;
    thumbnailUrl?: string;
    media?: { id?: string; blobUrl: string; contentType?: string; blobPathname?: string }[];
  } | null>(null);
  const [drafts, setDrafts] = React.useState<DraftMap>({});
  const [activeCell, setActiveCell] = React.useState<{ id: string; field: EditableField } | null>(null);
  const [uploadMode, setUploadMode] = React.useState<"single" | "multiple">("single");
  const [handledQuickAdd, setHandledQuickAdd] = React.useState(false);
  const [isEditingId, setIsEditingId] = React.useState<string | null>(null);
  const [mobileStatusUpdatingId, setMobileStatusUpdatingId] = React.useState<string | null>(null);

  const updateProductMutation = useUpdateProduct(bootstrap?.storeId ?? "");

  React.useEffect(() => {
    const quickAdd = searchParams.get("quickAdd");
    if (quickAdd && !handledQuickAdd) {
      setUploadMode("single");
      setUploadModalOpen(true);
      setHandledQuickAdd(true);
      // Stay on current page; no redirect to products list
    }
  }, [handledQuickAdd, searchParams]);

  // Optimistic delete - removes instantly from UI
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;

    // This will optimistically remove the product from the list
    deleteProduct.mutate(id, {
      onError: (error) => {
        alert(error instanceof Error ? error.message : "Failed to delete product");
      },
    });
  };

  const handleEdit = async (id: string) => {
    try {
      setIsEditingId(id);
      const res = await fetch(`/api/products/${id}`);
      if (!res.ok) throw new Error("Failed to load product");
      const product = (await res.json()) as ProductApiRow;
      // Convert null to undefined for fields to match modal's expected type
      setEditingProduct({
        id: product.id,
        productName: product.productName,
        description: product.description ?? undefined,
        priceAmount: product.priceAmount,
        currency: product.currency,
        quantity: product.quantity,
        status: product.status,
        media: product.media?.map((m) => ({
          blobUrl: m.blobUrl,
          contentType: m.contentType ?? undefined,
          blobPathname: m.blobPathname ?? undefined,
        })),
      });
      setEditModalOpen(true);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to load product");
    } finally {
      setIsEditingId(null);
    }
  };

  const updateProductCache = React.useCallback(
    (storeId: string, product: ProductApiRow) => {
      const newRow: ProductTableRow = {
        id: product.id,
        name: product.productName,
        slug: product.slug,
        description: product.description,
        priceAmount: product.priceAmount,
        currency: product.currency,
        quantity: product.quantity,
        status: product.status,
        thumbnailUrl: product.media?.[0]?.blobUrl,
        thumbnailType: product.media?.[0]?.contentType || undefined,
        salesAmount: product.salesAmount ?? 0,
      };

      // Updates cache if it exists, otherwise we'll rely on invalidate
      queryClient.setQueryData<ProductTableRow[]>(
        queryKeys.products.list(storeId),
        (old) => {
          if (!old) return [newRow];
          const exists = old.find((p) => p.id === newRow.id);
          if (exists) {
            return old.map((p) => (p.id === newRow.id ? newRow : p));
          }
          return [newRow, ...old];
        }
      );
    },
    [queryClient]
  );

  const handleCreateProduct = async (
    data: {
      productName: string;
      description: string;
      priceAmount: number;
      currency: string;
      quantity: number;
    },
    media: { url: string; pathname: string; contentType: string }[]
  ) => {
    if (!bootstrap?.storeId) return;

    // 1. Optimistic Update
    const tempId = `temp-${Date.now()}`;
    const optimisticProduct: ProductApiRow = {
      id: tempId,
      storeId: bootstrap.storeId,
      productName: data.productName,
      slug: data.productName.toLowerCase().replace(/\s+/g, "-"),
      description: data.description,
      priceAmount: data.priceAmount,
      currency: data.currency,
      quantity: data.quantity,
      status: "ready",
      media: media.map((m) => ({ ...m, blobUrl: m.url, blobPathname: m.pathname })),
      salesAmount: 0,
    };

    updateProductCache(bootstrap.storeId, optimisticProduct);

    // 2. API Call in Background
    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: bootstrap.storeId,
          title: data.productName,
          description: data.description,
          priceAmount: data.priceAmount,
          currency: data.currency,
          quantity: data.quantity,
          source: "manual",
          status: "ready",
          media,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create product");
      }

      const newProduct = (await response.json()) as ProductApiRow;

      // 3. Replace Optimistic with Real
      queryClient.setQueryData<ProductTableRow[]>(
        queryKeys.products.list(bootstrap.storeId),
        (old) => {
          if (!old) return [];
          return old.map((p) => (p.id === tempId ? {
            id: newProduct.id,
            name: newProduct.productName,
            slug: newProduct.slug,
            description: newProduct.description,
            priceAmount: newProduct.priceAmount,
            currency: newProduct.currency,
            quantity: newProduct.quantity,
            status: newProduct.status,
            thumbnailUrl: newProduct.media?.[0]?.blobUrl,
            thumbnailType: newProduct.media?.[0]?.contentType || undefined,
            salesAmount: newProduct.salesAmount ?? 0,
          } : p));
        }
      );

      // Force sync to be safe
      invalidate(bootstrap.storeId);
    } catch (error) {
      console.error(error);
      alert("Failed to create product in background. Please refresh.");
      // Rollback
      queryClient.setQueryData<ProductTableRow[]>(
        queryKeys.products.list(bootstrap.storeId),
        (old) => old?.filter((p) => p.id !== tempId) ?? []
      );
    }
  };

  const handleProductUpdated = async (product?: ProductApiRow) => {
    if (bootstrap?.storeId) {
      if (product) {
        updateProductCache(bootstrap.storeId, product);
      }
      await refetch();
      invalidate(bootstrap.storeId);
    }
  };

  const handleDraftChange = React.useCallback(
    (product: ProductTableRow, field: EditableField, value: string) => {
      setDrafts((prev) => {
        const next = { ...prev } as DraftMap;
        const baseline =
          field === "name"
            ? product.name
            : field === "priceAmount"
              ? product.priceAmount.toString()
              : product.quantity.toString();

        if (value === baseline) {
          const productDraft = next[product.id];
          if (productDraft) {
            delete productDraft[field];
            if (Object.keys(productDraft).length === 0) {
              delete next[product.id];
            }
          }
          return next;
        }

        next[product.id] = {
          ...next[product.id],
          [field]: value,
        };
        return next;
      });
    },
    []
  );

  const hasInvalidDraft = React.useCallback((draft?: Partial<Record<EditableField, string>>) => {
    if (!draft) return false;
    if (draft.name !== undefined && draft.name.trim() === "") return true;
    if (draft.priceAmount !== undefined) {
      const trimmed = draft.priceAmount.trim();
      if (trimmed === "" || Number.isNaN(Number(trimmed))) return true;
    }
    if (draft.quantity !== undefined) {
      const trimmed = draft.quantity.trim();
      if (trimmed === "" || Number.isNaN(Number(trimmed))) return true;
    }
    return false;
  }, []);

  const handleInlineSave = React.useCallback(
    (productId: string) => {
      if (!UUID_REGEX.test(productId)) {
        alert("This product is still syncing. Please try again in a moment.");
        if (bootstrap?.storeId) {
          invalidate(bootstrap.storeId);
        }
        return;
      }

      const draft = drafts[productId];
      if (!draft) {
        setActiveCell(null);
        return;
      }

      if (hasInvalidDraft(draft)) {
        alert("Please enter valid values before saving.");
        return;
      }

      const payload: Partial<ProductApiRow> = {};
      if (draft.name !== undefined) {
        const trimmed = draft.name.trim();
        if (trimmed) {
          payload.productName = trimmed;
        }
      }
      if (draft.priceAmount !== undefined) {
        payload.priceAmount = Number(draft.priceAmount);
      }
      if (draft.quantity !== undefined) {
        payload.quantity = Number(draft.quantity);
      }

      if (Object.keys(payload).length === 0) {
        return;
      }

      const draftSnapshot = draft;

      // Optimistic local UX: exit edit mode immediately while the mutation runs.
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });
      setActiveCell(null);

      updateProductMutation.mutate(
        { id: productId, data: payload },
        {
          onSuccess: (updatedProduct) => {
            if (bootstrap?.storeId && updatedProduct) {
              updateProductCache(bootstrap.storeId, updatedProduct);
            }
          },
          onError: (error) => {
            setDrafts((prev) => ({
              ...prev,
              [productId]: {
                ...prev[productId],
                ...draftSnapshot,
              },
            }));
            alert(error instanceof Error ? error.message : "Failed to save product");
          },
        }
      );
    },
    [bootstrap?.storeId, drafts, hasInvalidDraft, invalidate, updateProductMutation, updateProductCache]
  );

  const handleAddProductSelect = React.useCallback((mode: "single" | "multiple") => {
    // ...
    setUploadMode(mode);
    setUploadModalOpen(true);
  }, []);

  const handleMobileStatusChange = React.useCallback(
    (productId: string, newStatus: ProductTableRow["status"]) => {
      if (!UUID_REGEX.test(productId)) {
        alert("This product is still syncing. Please try again in a moment.");
        if (bootstrap?.storeId) {
          invalidate(bootstrap.storeId);
        }
        return;
      }

      setMobileStatusUpdatingId(productId);

      updateProductMutation.mutate(
        { id: productId, data: { status: newStatus } },
        {
          onSuccess: (updatedProduct) => {
            if (bootstrap?.storeId && updatedProduct) {
              updateProductCache(bootstrap.storeId, updatedProduct);
            }
          },
          onError: (error) => {
            alert(error instanceof Error ? error.message : "Failed to update product status");
          },
          onSettled: () => {
            setMobileStatusUpdatingId((current) =>
              current === productId ? null : current
            );
            if (bootstrap?.storeId) {
              invalidate(bootstrap.storeId);
            }
          },
        }
      );
    },
    [bootstrap?.storeId, invalidate, updateProductMutation, updateProductCache]
  );

  const selectedIds = React.useMemo(() => Object.keys(rowSelection), [rowSelection]);

  const handlePublishSelected = React.useCallback(async () => {
    if (selectedIds.length === 0) return;

    // Optimistic Update
    const previousProducts = queryClient.getQueryData<ProductTableRow[]>(
      queryKeys.products.list(bootstrap?.storeId || "")
    );

    queryClient.setQueryData<ProductTableRow[]>(
      queryKeys.products.list(bootstrap?.storeId || ""),
      (old) =>
        old?.map((p) =>
          selectedIds.includes(p.id) ? { ...p, status: "active" } : p
        ) ?? []
    );

    setIsPublishing(true);

    try {
      if (!bootstrap?.storeId) {
        throw new Error("Store context missing");
      }

      const res = await fetch("/api/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId: bootstrap.storeId, ids: selectedIds, action: "publish" }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Publish failed");
      }
      if (bootstrap?.storeId) {
        invalidate(bootstrap.storeId);
      }
      setRowSelection({});
    } catch (err) {
      // Revert optimistic update
      if (bootstrap?.storeId) {
        queryClient.setQueryData(
          queryKeys.products.list(bootstrap.storeId),
          previousProducts
        );
      }
      alert(err instanceof Error ? err.message : "Publish failed");
    } finally {
      setIsPublishing(false);
    }
  }, [bootstrap?.storeId, invalidate, selectedIds, queryClient]);

  React.useEffect(() => {
    // Clear selections for rows that no longer exist
    const existingIds = new Set(rows.map((r) => r.id));
    setRowSelection((prev) => {
      let changed = false;
      const next: Record<string, boolean> = {};
      Object.entries(prev).forEach(([id, value]) => {
        if (value && existingIds.has(id)) {
          next[id] = true;
        } else {
          changed = true;
        }
      });
      // If nothing changed, return prev to avoid unnecessary rerenders
      if (!changed && Object.keys(prev).length === Object.keys(next).length) {
        return prev;
      }
      return next;
    });
  }, [rows]);

  const toggleAll = (checked: boolean) => {
    if (checked) {
      const next: Record<string, boolean> = {};
      rows.forEach((r) => {
        next[r.id] = true;
      });
      setRowSelection(next);
    } else {
      setRowSelection({});
    }
  };

  const toggleOne = (id: string, checked: boolean) => {
    setRowSelection((prev) => {
      const next = { ...prev };
      if (checked) next[id] = true;
      else delete next[id];
      return next;
    });
  };

  const columns: ColumnDef<ProductTableRow>[] = [
    {
      id: "select",
      header: () => (
        <Checkbox
          aria-label="Select all"
          checked={selectedIds.length > 0 && selectedIds.length === rows.length}
          indeterminate={selectedIds.length > 0 && selectedIds.length < rows.length}
          onCheckedChange={(checked) => toggleAll(Boolean(checked))}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label="Select row"
          checked={rowSelection[row.original.id]}
          onCheckedChange={(checked) => toggleOne(row.original.id, Boolean(checked))}
        />
      ),
      size: 40,
      enableSorting: false,
    },
    {
      accessorKey: "name",
      header: "Product",
      size: 240,
      cell: ({ row }) => {
        const product = row.original;
        const field: EditableField = "name";
        const isEditing = activeCell?.id === product.id && activeCell.field === field;
        const value = drafts[product.id]?.[field] ?? product.name;

        return (
          <div className="flex max-w-[240px] items-center gap-3 min-w-0">
            <div className="relative size-10 overflow-hidden rounded-md bg-muted shrink-0">
              <ProductThumbnail
                url={product.thumbnailUrl}
                name={product.name}
                contentType={product.thumbnailType}
              />
            </div>
            <div className="min-w-0 flex-1">
              {isEditing ? (
                <Input
                  autoFocus
                  value={value}
                  onChange={(event) => handleDraftChange(product, field, event.target.value)}
                  onBlur={() => handleInlineSave(product.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleInlineSave(product.id);
                    }
                    if (event.key === "Escape") {
                      setDrafts((prev) => {
                        const next = { ...prev };
                        delete next[product.id];

                        return next;
                      });
                      setActiveCell(null);
                    }
                  }}
                  className="h-9 border-0 bg-transparent px-0 font-semibold shadow-none focus-visible:ring-0"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveCell({ id: product.id, field })}
                  className="group flex items-center gap-1.5 text-left hover:bg-muted/50 p-1 -ml-1 rounded-md transition-colors w-full"
                >
                  <span className="truncate">{value}</span>
                  <HugeiconsIcon icon={Edit02Icon} className="size-3.5 opacity-0 group-hover:opacity-100 text-muted-foreground transition-opacity shrink-0" />
                </button>
              )}
            </div>
          </div>
        );
      },
    },
    {
      id: "price",
      header: "Price",
      size: 120,
      cell: ({ row }) => {
        const product = row.original;
        const field: EditableField = "priceAmount";
        const isEditing = activeCell?.id === product.id && activeCell.field === field;
        const value = drafts[product.id]?.[field] ?? product.priceAmount.toString();

        return isEditing ? (
          <Input
            autoFocus
            type="text"
            inputMode="decimal"
            value={value}
            onChange={(event) => handleDraftChange(product, field, event.target.value)}
            onBlur={() => handleInlineSave(product.id)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleInlineSave(product.id);
              }
              if (event.key === "Escape") {
                setDrafts((prev) => {
                  const next = { ...prev };
                  delete next[product.id];

                  return next;
                });
                setActiveCell(null);
              }
            }}
            className="h-9 w-24 border-0 bg-transparent px-0 text-sm font-medium shadow-none focus-visible:ring-0"
          />
        ) : (
          <button
            type="button"
            onClick={() => setActiveCell({ id: product.id, field })}
            className="group flex items-center gap-1.5 text-sm font-medium whitespace-nowrap hover:bg-muted/50 p-1 -ml-1 rounded-md transition-colors"
          >
            <span>{value}</span>
            <HugeiconsIcon icon={Edit02Icon} className="size-3.5 opacity-0 group-hover:opacity-100 text-muted-foreground transition-opacity" />
          </button>
        );
      },
    },
    {
      id: "inventory",
      header: "Inventory",
      size: 90,
      cell: ({ row }) => {
        const product = row.original;
        const field: EditableField = "quantity";
        const isEditing = activeCell?.id === product.id && activeCell.field === field;
        const value = drafts[product.id]?.[field] ?? product.quantity.toString();

        return isEditing ? (
          <Input
            autoFocus
            type="text"
            inputMode="numeric"
            value={value}
            onChange={(event) => handleDraftChange(product, field, event.target.value)}
            onBlur={() => handleInlineSave(product.id)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleInlineSave(product.id);
              }
              if (event.key === "Escape") {
                setDrafts((prev) => {
                  const next = { ...prev };
                  delete next[product.id];
                  return next;
                });
                setActiveCell(null);
              }
            }}
            className="h-9 w-16 border-0 bg-transparent px-0 text-sm font-medium shadow-none focus-visible:ring-0"
          />
        ) : (
          <button
            type="button"
            onClick={() => setActiveCell({ id: product.id, field })}
            className="group flex items-center gap-1.5 text-sm font-medium whitespace-nowrap hover:bg-muted/50 p-1 -ml-1 rounded-md transition-colors"
          >
            <span>{value}</span>
            <HugeiconsIcon icon={Edit02Icon} className="size-3.5 opacity-0 group-hover:opacity-100 text-muted-foreground transition-opacity" />
          </button>
        );
      },
    },
    {
      id: "sales",
      header: "Sales",
      size: 90,
      cell: ({ row }) => (
        <span className="text-sm font-semibold whitespace-nowrap">
          {formatMoney(row.original.salesAmount ?? 0, row.original.currency)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      size: 56,
      cell: ({ row }) => {
        const product = row.original;

        return (
          <div className="flex items-center justify-end">
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={() => handleDelete(product.id)}
              disabled={deleteProduct.isPending}
              aria-label="Delete product"
            >
              <HugeiconsIcon icon={Delete02Icon} className="size-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  const error = queryError?.message ?? null;
  const totalProducts = rows.length;
  const activeCount = rows.filter((p) => p.status === "active" || p.status === "ready").length;
  const draftCount = rows.filter((p) => p.status === "draft").length;
  const lowStockCount = rows.filter((p) => p.quantity > 0 && p.quantity < 5).length;

  const statSegments = [
    {
      label: "Total Products",
      value: totalProducts.toLocaleString(),
      changeLabel: "",
      changeTone: "neutral" as const,
    },
    {
      label: "Active",
      value: activeCount.toLocaleString(),
      changeLabel: "",
      changeTone: "neutral" as const,
    },
    {
      label: "Low Stock",
      value: lowStockCount.toLocaleString(),
      changeLabel: "",
      changeTone: "neutral" as const,
    },
    {
      label: "Drafts",
      value: draftCount.toLocaleString(),
      changeLabel: "",
      changeTone: "neutral" as const,
    },
  ];

  if (isLoading) {
    return <ProductsPageSkeleton />;
  }

  return (
    <div className="md:p-6 p-0">
      {/* Mobile View */}
      <div className="block md:hidden">
        {isEditingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-2">
              <HugeiconsIcon icon={Loading03Icon} className="size-8 animate-spin text-primary" />
              <span className="text-sm font-medium text-foreground">Loading product...</span>
            </div>
          </div>
        )}
        <ProductsMobileView
          bootstrap={bootstrap}
          rows={rows}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAddSelect={handleAddProductSelect}
          onStatusChange={handleMobileStatusChange}
          statusUpdatingProductId={mobileStatusUpdatingId}
          isPublishing={isPublishing}
        />
      </div>

      {/* Desktop View */}
      <div className="hidden md:block space-y-6 overflow-hidden min-w-0">
        {bootstrapError && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-md">{bootstrapError}</div>
        )}
        {error && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-md">{error}</div>
        )}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Products</h1>
            <p className="text-sm text-muted-foreground">Keep your catalog tidy and stay on top of stock.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <Button
              variant="outline"
              disabled={selectedIds.length === 0 || isPublishing}
              onClick={handlePublishSelected}
              className="sm:order-1"
            >
              {isPublishing ? "Publishing..." : (
                <span className="inline-flex items-center gap-2">
                  <HugeiconsIcon icon={SparklesIcon} className="size-4" />
                  Publish
                </span>
              )}
            </Button>
            <AddProductButton
              onSelect={handleAddProductSelect}
            />
          </div>
        </div>

        <SegmentedStatsCard segments={statSegments} />

        <div className="rounded-md border bg-card p-3 overflow-hidden min-w-0">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 rounded-lg border border-dashed border-border/60 p-3 bg-muted/30">
                  <div className="size-10 bg-muted rounded-md animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/3 animate-pulse" />
                    <div className="h-4 bg-muted rounded w-24 animate-pulse" />
                  </div>
                  <div className="h-4 bg-muted rounded w-16 animate-pulse shrink-0" />
                  <div className="h-6 bg-muted rounded w-20 animate-pulse shrink-0" />
                  <div className="size-8 bg-muted rounded animate-pulse shrink-0" />
                </div>
              ))}
            </div>
          ) : (
            <DataTable
              className="table-fixed"
              columns={columns}
              data={rows}
              rowSelection={rowSelection}

              onRowSelectionChange={(updater) => {
                setRowSelection((prev) =>
                  typeof updater === "function" ? updater(prev) : updater
                );
              }}
            />
          )}
        </div>
      </div>

      <UploadModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        tenantId={bootstrap?.tenantId || ""}
        onCreate={handleCreateProduct}
        mode={uploadMode}
      />

      <EditProductModal
        product={editingProduct}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        tenantId={bootstrap?.tenantId || ""}
        onProductUpdated={handleProductUpdated}
      />
    </div>
  );
}