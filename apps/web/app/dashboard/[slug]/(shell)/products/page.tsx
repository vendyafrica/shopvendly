"use client";

import * as React from "react";
import { SegmentedStatsCard } from "@/features/dashboard/components/segmented-stats-card";
import { DataTable } from "@/features/dashboard/components/data-table";

import type { ColumnDef } from "@tanstack/react-table";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { AddProductButton } from "./components/add-product-button";
import { useTenant } from "@/features/dashboard/context/tenant-context";

import Image from "next/image";
import { Button } from "@shopvendly/ui/components/button";
import { Input } from "@shopvendly/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shopvendly/ui/components/select";
import { HugeiconsIcon } from "@hugeicons/react";
import { SparklesIcon, Edit02Icon } from "@hugeicons/core-free-icons";
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

const STATUS_STYLES: Record<ProductTableRow["status"], { label: string; badgeClass: string }> = {
  draft: { label: "Draft", badgeClass: "bg-muted text-muted-foreground border-dashed" },
  ready: { label: "Ready", badgeClass: "bg-amber-50 text-amber-700 border-amber-200" },
  active: { label: "Active", badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  "sold-out": { label: "Sold out", badgeClass: "bg-rose-50 text-rose-700 border-rose-200" },
};

type EditableField = "name" | "priceAmount" | "quantity" | "status";
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
        className="h-full w-full object-cover"
        muted
        playsInline
        loop
        autoPlay
      />
    );
  }

  return (
    <Image
      src={url}
      alt={name}
      fill
      className="object-cover"
      unoptimized={url.includes(".ufs.sh")}
      onError={() => setForceVideo(true)}
    />
  );
}

export default function ProductsPage() {
  const { bootstrap, error: bootstrapError } = useTenant();
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
  const [activeCell, setActiveCell] = React.useState<{ id: string; field: EditableField } | null>(null);
  const [drafts, setDrafts] = React.useState<DraftMap>({});
  const [savingId, setSavingId] = React.useState<string | null>(null);
  const [uploadMode, setUploadMode] = React.useState<"single" | "multiple">("single");

  const updateProductMutation = useUpdateProduct(bootstrap?.storeId ?? "");

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

  const startEditing = React.useCallback((productId: string, field: EditableField) => {
    setActiveCell({ id: productId, field });
  }, []);

  const stopEditing = React.useCallback(() => {
    setActiveCell(null);
  }, []);

  const getDraftValue = React.useCallback(
    (product: ProductTableRow, field: EditableField) => {
      const draftValue = drafts[product.id]?.[field];
      if (draftValue !== undefined) return draftValue;
      if (field === "name") return product.name;
      if (field === "priceAmount") return product.priceAmount.toString();
      if (field === "quantity") return product.quantity.toString();
      return product.status;
    },
    [drafts]
  );

  const handleDraftChange = React.useCallback(
    (product: ProductTableRow, field: EditableField, value: string) => {
      setDrafts((prev) => {
        const next = { ...prev } as DraftMap;
        const baseline =
          field === "name"
            ? product.name
            : field === "priceAmount"
              ? product.priceAmount.toString()
              : field === "quantity"
                ? product.quantity.toString()
                : product.status;

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
      const draft = drafts[productId];
      if (!draft) return;

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
      if (draft.status !== undefined) {
        payload.status = draft.status as ProductTableRow["status"];
      }

      if (Object.keys(payload).length === 0) {
        return;
      }

      setSavingId(productId);
      updateProductMutation.mutate(
        { id: productId, data: payload },
        {
          onSuccess: (updatedProduct) => {
            if (bootstrap?.storeId && updatedProduct) {
              updateProductCache(bootstrap.storeId, updatedProduct);
            }
            setDrafts((prev) => {
              const next = { ...prev };
              delete next[productId];
              return next;
            });
            setActiveCell(null);
          },
          onError: (error) => {
            alert(error instanceof Error ? error.message : "Failed to save product");
          },
          onSettled: () => {
            setSavingId((prev) => (prev === productId ? null : prev));
          },
        }
      );
    },
    [bootstrap?.storeId, drafts, hasInvalidDraft, updateProductMutation, updateProductCache]
  );

  const handleAddProductSelect = React.useCallback((mode: "single" | "multiple") => {
    setUploadMode(mode);
    setUploadModalOpen(true);
  }, []);

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
      const res = await fetch("/api/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds, action: "publish" }),
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
      size: 32,
      enableSorting: false,
    },
    {
      accessorKey: "name",
      header: "Product",
      cell: ({ row }) => {
        const product = row.original;
        const field: EditableField = "name";
        const isEditing = activeCell?.id === product.id && activeCell.field === field;
        const value = getDraftValue(product, field);

        return (
          <div className="flex items-center gap-3 min-w-0">
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
                  onBlur={() => {
                    handleInlineSave(product.id);
                    stopEditing();
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") handleInlineSave(product.id);
                    if (event.key === "Escape") {
                      // Reset draft on escape
                      setDrafts((prev) => {
                        const next = { ...prev };
                        delete next[product.id];
                        return next;
                      });
                      stopEditing();
                    }
                  }}
                  className="h-9 border border-border bg-background font-semibold"
                />
              ) : (
                <button
                  type="button"
                  className="group flex items-center gap-2 truncate font-semibold text-left w-full hover:bg-muted/50 p-1 -ml-1 rounded-md transition-colors"
                  onClick={() => startEditing(product.id, field)}
                  title={product.name}
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
      cell: ({ row }) => {
        const product = row.original;
        const field: EditableField = "priceAmount";
        const isEditing = activeCell?.id === product.id && activeCell.field === field;
        const value = getDraftValue(product, field);

        return (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">{product.currency}</span>
            {isEditing ? (
              <Input
                autoFocus
                type="number"
                inputMode="decimal"
                value={value}
                onChange={(event) => handleDraftChange(product, field, event.target.value)}
                onBlur={() => {
                  handleInlineSave(product.id);
                  stopEditing();
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleInlineSave(product.id);
                  if (event.key === "Escape") {
                    setDrafts((prev) => {
                      const next = { ...prev };
                      delete next[product.id];
                      return next;
                    });
                    stopEditing();
                  }
                }}
                className="h-9 w-28 border border-border bg-background text-sm font-medium"
              />
            ) : (
              <button
                type="button"
                onClick={() => startEditing(product.id, field)}
                className="group flex items-center gap-1.5 text-sm font-medium whitespace-nowrap hover:bg-muted/50 p-1 -ml-1 rounded-md transition-colors"
              >
                <span>{formatMoney(product.priceAmount, product.currency)}</span>
                <HugeiconsIcon icon={Edit02Icon} className="size-3.5 opacity-0 group-hover:opacity-100 text-muted-foreground transition-opacity" />
              </button>
            )}
          </div>
        );
      },
    },
    {
      id: "inventory",
      header: "Inventory",
      cell: ({ row }) => {
        const product = row.original;
        const field: EditableField = "quantity";
        const isEditing = activeCell?.id === product.id && activeCell.field === field;
        const value = getDraftValue(product, field);

        return isEditing ? (
          <Input
            autoFocus
            type="number"
            inputMode="numeric"
            value={value}
            onChange={(event) => handleDraftChange(product, field, event.target.value)}
            onBlur={() => {
              handleInlineSave(product.id);
              stopEditing();
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") handleInlineSave(product.id);
              if (event.key === "Escape") {
                setDrafts((prev) => {
                  const next = { ...prev };
                  delete next[product.id];
                  return next;
                });
                stopEditing();
              }
            }}
            className="h-9 w-20 border border-border bg-background text-sm font-medium"
          />
        ) : (
          <button
            type="button"
            className="group flex items-center gap-1.5 text-sm font-medium hover:bg-muted/50 p-1 -ml-1 rounded-md transition-colors"
            onClick={() => startEditing(product.id, field)}
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
      cell: ({ row }) => (
        <span className="text-sm font-semibold whitespace-nowrap">
          {formatMoney(row.original.salesAmount ?? 0, row.original.currency)}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const product = row.original;
        const field: EditableField = "status";
        // Get optimistic draft status if it exists, otherwise fall back to product status
        const draftValue = drafts[product.id]?.status;
        const currentStatus = (draftValue ?? product.status) as keyof typeof STATUS_STYLES;
        const badge = STATUS_STYLES[currentStatus];

        return (
          <Select
            value={currentStatus}
            onValueChange={(value) => {
              if (!value) return;
              handleDraftChange(product, field, value);
              // Optimistically save status change immediately since it's a dropdown change
              setTimeout(() => handleInlineSave(product.id), 0);
            }}
          >
            <SelectTrigger className={`h-8 w-[110px] px-3 py-1 text-xs font-medium border ${badge.badgeClass} focus:ring-0 focus:ring-offset-0 bg-transparent`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_STYLES).map(([key, style]) => (
                <SelectItem key={key} value={key} className="text-xs font-medium">
                  {style.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      },
    },
    {
      id: "actions",
      header: "Quick actions",
      cell: ({ row }) => {
        const product = row.original;
        const draft = drafts[product.id];
        const isDirty = !!(draft && Object.keys(draft).length > 0);
        const invalid = hasInvalidDraft(draft);
        const isSaving = savingId === product.id;

        return (
          <div className="flex items-center gap-2 justify-end">
            <Button
              size="sm"
              onClick={() => handleInlineSave(product.id)}
              disabled={!isDirty || invalid || isSaving}
            >
              {isSaving ? "Saving..." : "Save"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-destructive border-destructive/40"
              onClick={() => handleDelete(product.id)}
              disabled={deleteProduct.isPending}
            >
              Delete
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
        <ProductsMobileView
          bootstrap={bootstrap}
          rows={rows}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAddSelect={handleAddProductSelect}
          onStatusChange={(productId, newStatus) => {
            const product = rows.find(r => r.id === productId);
            if (product) {
              handleDraftChange(product, 'status', newStatus);
              setTimeout(() => handleInlineSave(productId), 0);
            }
          }}
          isPublishing={isPublishing}
        />
      </div>

      {/* Desktop View */}
      <div className="hidden md:block space-y-6">
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

        <div className="rounded-md border bg-card p-3">
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