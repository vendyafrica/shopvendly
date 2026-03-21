"use client";

import * as React from "react";
import { DataTable } from "@/modules/admin/components/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { useTenant } from "@/modules/admin/context/tenant-context";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { Button } from "@shopvendly/ui/components/button";
import { Input } from "@shopvendly/ui/components/input";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  SparklesIcon, 
  Edit02Icon, 
  Delete02Icon, 
  MoreHorizontalIcon, 
  Package01Icon, 
  ShoppingBag01Icon, 
  AlertCircleIcon, 
  FileEditIcon, 
  Tag01Icon, 
  Download01Icon, 
  Upload01Icon, 
  Search01Icon, 
  FilterIcon, 
  Sorting05Icon,
  Add01Icon,
} from "@hugeicons/core-free-icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@shopvendly/ui/components/dropdown-menu";
import { ProductsMobileView } from "./components/products-mobile-view";
import { Checkbox } from "@shopvendly/ui/components/checkbox";
import { type EditableField, type DraftMap } from "@/modules/admin/models";

import {
  useProducts,
  useDeleteProduct,
  useInvalidateProducts,
  useUpdateProduct,
  type ProductTableRow,
  type ProductApiRow,
} from "@/modules/products/hooks/use-products";
import { ProductsPageSkeleton } from "@/components/ui/page-skeletons";
import { isLikelyVideoMedia } from "@/utils/misc";
import { cn } from "@shopvendly/ui/lib/utils";

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
  const { bootstrap } = useTenant();
  const params = useParams();
  const slug = params.slug as string;
  const { invalidate } = useInvalidateProducts();

  const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({});
  const [activeCell, setActiveCell] = React.useState<{ id: string; field: EditableField } | null>(null);
  const [drafts, setDrafts] = React.useState<DraftMap>({});
  const [mobileStatusUpdatingId, setMobileStatusUpdatingId] = React.useState<string | null>(null);

  const { data: rows = [], isLoading, error: queryError, refetch } = useProducts(bootstrap?.storeId);
  const deleteProductMutation = useDeleteProduct(bootstrap?.storeId ?? "");
  const updateProductMutation = useUpdateProduct(bootstrap?.storeId ?? "");

  const handleDelete = async (id: string) => {
    deleteProductMutation.mutate(id, {
      onError: (error) => {
        alert(error instanceof Error ? error.message : "Failed to delete product");
      },
    });
  };

  const handleDraftChange = (product: ProductTableRow, field: EditableField, value: string) => {
    setDrafts((prev) => ({
      ...prev,
      [product.id]: {
        ...prev[product.id],
        [field]: value,
      },
    }));
  };

  const handleInlineSave = async (id: string) => {
    const draft = drafts[id];
    if (!draft) {
      setActiveCell(null);
      return;
    }

    const payload: Partial<ProductApiRow> = {};
    if (draft.name !== undefined) payload.productName = draft.name;
    if (draft.priceAmount !== undefined) payload.priceAmount = Number(draft.priceAmount);
    if (draft.quantity !== undefined) payload.quantity = Number(draft.quantity);

    try {
      await updateProductMutation.mutateAsync({ id, data: payload });
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (e) {
      console.error("Failed to update product", e);
    } finally {
      setActiveCell(null);
    }
  };

  const handleMobileStatusChange = async (id: string, status: "ready" | "draft" | "active" | "sold-out") => {
    setMobileStatusUpdatingId(id);
    try {
      if (!bootstrap?.storeId) return;
      await updateProductMutation.mutateAsync({ id, data: { status } });
      invalidate(bootstrap.storeId);
    } catch (e) {
      console.error("Failed to update status", e);
    } finally {
      setMobileStatusUpdatingId(null);
    }
  };

  const columns: ColumnDef<ProductTableRow>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-[2px]"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-[2px]"
        />
      ),
      size: 40,
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: "Product",
      size: 300,
      cell: ({ row }) => {
        const product = row.original;
        const field: EditableField = "name";
        const isEditing = activeCell?.id === product.id && activeCell?.field === field;
        const value = drafts[product.id]?.[field] ?? (product.name as string);

        return (
          <div className="flex items-center gap-3">
            <div className="relative aspect-square size-10 shrink-0 overflow-hidden rounded-md border bg-muted/40 group-hover:bg-muted/60 transition-colors">
              <ProductThumbnail url={product.thumbnailUrl} name={product.name} contentType={product.thumbnailType} />
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
                <div className="group flex items-center gap-1.5 text-left p-1 -ml-1 rounded-md transition-colors w-full">
                  <Link 
                    href={`/admin/${slug}/products/${product.id}`}
                    className="truncate hover:underline font-semibold text-foreground decoration-primary/30"
                  >
                    {value}
                  </Link>
                  <button
                    type="button"
                    onClick={() => setActiveCell({ id: product.id, field })}
                    className="inline-flex items-center"
                  >
                    <HugeiconsIcon icon={Edit02Icon} className="size-3.5 opacity-0 group-hover:opacity-100 text-muted-foreground transition-opacity shrink-0" />
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      id: "category",
      header: "Category",
      size: 130,
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground bg-muted/20 px-2 py-1 rounded-full border border-border/40">
          {row.original.category || "Uncategorized"}
        </span>
      ),
    },
    {
      accessorKey: "price",
      header: "Price",
      size: 120,
      cell: ({ row }) => {
        const product = row.original;
        const field: EditableField = "priceAmount";
        const isEditing = activeCell?.id === product.id && activeCell?.field === field;
        const value = drafts[product.id]?.[field] ?? (product.priceAmount as number);

        return (
          <div className="group flex items-center gap-1.5 text-left transition-colors h-9">
            {isEditing ? (
              <Input
                autoFocus
                type="number"
                value={value}
                onChange={(event) => handleDraftChange(product, field, event.target.value)}
                onBlur={() => handleInlineSave(product.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleInlineSave(product.id);
                  if (event.key === "Escape") setActiveCell(null);
                }}
                className="h-8 w-24 px-1.5 py-0 border bg-background text-xs"
              />
            ) : (
              <>
                <span className="font-medium text-sm tabular-nums">
                  {formatMoney(Number(value), product.currency)}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveCell({ id: product.id, field })}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <HugeiconsIcon icon={Edit02Icon} className="size-3 text-muted-foreground" />
                </button>
              </>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "quantity",
      header: "Inventory",
      size: 120,
      cell: ({ row }) => {
        const product = row.original;
        const field: EditableField = "quantity";
        const isEditing = activeCell?.id === product.id && activeCell?.field === field;
        const value = drafts[product.id]?.[field] ?? (product.quantity as number);

        return (
          <div className="group flex items-center gap-1.5 text-left transition-colors h-9">
            {isEditing ? (
              <Input
                autoFocus
                type="number"
                value={value}
                onChange={(event) => handleDraftChange(product, field, event.target.value)}
                onBlur={() => handleInlineSave(product.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleInlineSave(product.id);
                  if (event.key === "Escape") setActiveCell(null);
                }}
                className="h-8 w-16 px-1.5 py-0 border bg-background text-xs"
              />
            ) : (
              <>
                <span className={cn(
                  "text-sm font-medium tabular-nums",
                  Number(value) <= 5 ? "text-amber-600" : "text-muted-foreground"
                )}>
                  {value} in stock
                </span>
                <button
                  type="button"
                  onClick={() => setActiveCell({ id: product.id, field })}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <HugeiconsIcon icon={Edit02Icon} className="size-3 text-muted-foreground" />
                </button>
              </>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      size: 100,
      cell: ({ row }) => (
        <span className={cn(
          "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
          row.original.status === "ready" ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" :
            row.original.status === "draft" ? "border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20" :
              "border-slate-200 bg-slate-50 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20"
        )}>
          {row.original.status}
        </span>
      ),
    },
  ];

  if (isLoading && rows.length === 0) {
    return <ProductsPageSkeleton />;
  }

  const error = queryError?.message ?? null;

  return (
    <div className="flex-1 space-y-4 px-4 py-4 md:px-8 md:py-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <HugeiconsIcon icon={Tag01Icon} className="size-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Products</h1>
              <p className="hidden text-xs text-muted-foreground sm:block">
                Manage your store inventory and availability.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-muted/40 rounded-lg p-0.5 border border-border/40">
              <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs font-semibold hover:bg-background/80 transition-all">
                <HugeiconsIcon icon={Download01Icon} className="size-3.5" />
                Export
              </Button>
              <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs font-semibold hover:bg-background/80 transition-all">
                <HugeiconsIcon icon={Upload01Icon} className="size-3.5" />
                Import
              </Button>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs font-semibold px-3 group">
                   More actions
                   <HugeiconsIcon icon={MoreHorizontalIcon} className="size-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem>
                  <HugeiconsIcon icon={SparklesIcon} className="mr-2 size-4 text-primary" />
                  AI Auto-Categorize
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive"
                  onClick={() => {
                    const selected = Object.keys(rowSelection);
                    if (selected.length === 0) return;
                    if (confirm(`Are you sure you want to delete ${selected.length} products?`)) {
                       selected.forEach(id => handleDelete(id));
                       setRowSelection({});
                    }
                  }}
                >
                  <HugeiconsIcon icon={Delete02Icon} className="mr-2 size-4" />
                  Delete Selected
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Link href={`/admin/${slug}/products/new`}>
              <Button size="sm" className="h-8 gap-1.5 bg-foreground text-xs font-bold text-background hover:bg-foreground/90 shadow-sm">
                <HugeiconsIcon icon={Add01Icon} className="size-4" />
                Add product
              </Button>
            </Link>
          </div>
        </div>

        {/* Compact Stats Cards */}
        <div className="flex gap-4 overflow-x-auto no-scrollbar py-1">
          {[
            { label: "Total", value: rows.length, icon: Package01Icon, color: "text-primary", bg: "bg-primary/10" },
            { label: "Active", value: rows.filter(r => r.status === "ready").length, icon: ShoppingBag01Icon, color: "text-emerald-600", bg: "bg-emerald-500/10" },
            { label: "Drafts", value: rows.filter(r => r.status === "draft").length, icon: FileEditIcon, color: "text-slate-600", bg: "bg-slate-500/10" },
            { label: "Low Stock", value: rows.filter(r => r.quantity <= 5).length, icon: AlertCircleIcon, color: "text-amber-600", bg: "bg-amber-500/10" }
          ].map((stat, i) => (
             <div key={i} className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-border/40 bg-card/50 min-w-fit shadow-sm">
                <div className={cn("p-1.5 rounded-md", stat.bg, stat.color)}>
                   <HugeiconsIcon icon={stat.icon} className="size-3.5" />
                </div>
                <div className="flex flex-col">
                   <span className="text-[10px] font-medium text-muted-foreground uppercase leading-tight tracking-wider">{stat.label}</span>
                   <span className="text-sm font-bold leading-none">{stat.value}</span>
                </div>
             </div>
          ))}
        </div>
      </div>

      <div className="mt-2 flex flex-col gap-4">
        {error && (
          <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive border border-destructive/25 flex items-center gap-3">
            <HugeiconsIcon icon={AlertCircleIcon} className="size-5 shrink-0" />
            <div>
              <p className="font-semibold">Error loading products</p>
              <p className="text-xs opacity-80">{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="ml-auto">
              Retry
            </Button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-muted/30 p-1 rounded-lg border border-border/40">
           <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto no-scrollbar">
              <Button variant="ghost" size="sm" className="h-8 text-xs font-semibold bg-background shadow-sm border border-border/60">
                All
              </Button>
              <Button variant="ghost" size="sm" className="h-8 text-xs font-semibold hover:bg-background/50">
                Active
              </Button>
              <Button variant="ghost" size="sm" className="h-8 text-xs font-semibold hover:bg-background/50">
                Ready
              </Button>
              <Button variant="ghost" size="sm" className="h-8 text-xs font-semibold hover:bg-background/50">
                Sold Out
              </Button>
              <Button variant="ghost" size="sm" className="h-8 px-2">
                <HugeiconsIcon icon={Add01Icon} className="size-3.5" />
              </Button>
           </div>
           
           <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <HugeiconsIcon icon={Search01Icon} className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input 
                  placeholder="Search products..." 
                  className="h-8 pl-8 text-xs border-0 bg-transparent focus-visible:ring-0 shadow-none w-full" 
                />
              </div>
              <div className="h-4 w-px bg-border/60 mx-1 hidden sm:block" />
              <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-foreground">
                <HugeiconsIcon icon={Sorting05Icon} className="size-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-foreground">
                <HugeiconsIcon icon={FilterIcon} className="size-4" />
              </Button>
           </div>
        </div>

        <DataTable
          columns={columns}
          data={rows}
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
          className="border-none shadow-none"
        />

        <div className="md:hidden">
          <ProductsMobileView
            bootstrap={bootstrap}
            rows={rows}
            onDelete={handleDelete}
            onStatusChange={handleMobileStatusChange}
            statusUpdatingProductId={mobileStatusUpdatingId}
            isPublishing={false}
          />
        </div>
      </div>
    </div>
  );
}