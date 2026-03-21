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
  Delete02Icon,
  MoreHorizontalIcon,
  AlertCircleIcon,
  Download01Icon,
  Upload01Icon,
  Search01Icon,
  Add01Icon,
  Tick01Icon,
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
// import { type EditableField, type DraftMap } from "@/modules/admin/models";

import {
  useProducts,
  useDeleteProduct,
  useInvalidateProducts,
  useUpdateProduct,
  type ProductTableRow,
  // type ProductApiRow,
} from "@/modules/products/hooks/use-products";
import { ProductsPageSkeleton } from "@/components/ui/page-skeletons";
import { isLikelyVideoMedia } from "@/utils/misc";
import { cn } from "@shopvendly/ui/lib/utils";

// function formatMoney(amount: number, currency: string) {
//   return new Intl.NumberFormat("en-KE", {
//     style: "currency",
//     currency,
//     minimumFractionDigits: 0,
//   }).format(amount);
// }

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
  // const [ setActiveCell] = React.useState<{ id: string; field: EditableField } | null>(null);
  // const [drafts, setDrafts] = React.useState<DraftMap>({});
  const [mobileStatusUpdatingId, setMobileStatusUpdatingId] = React.useState<string | null>(null);
  const [statusFilter, setStatusFilter] = React.useState<"all" | "active" | "draft" | "archived">("all");
  const [searchQuery, setSearchQuery] = React.useState("");

  const { data: rows = [], isLoading, error: queryError, refetch } = useProducts(bootstrap?.storeId);

  const filteredRows = React.useMemo(() => {
    let result = rows;

    if (statusFilter !== "all") {
      result = result.filter((row) => {
        if (statusFilter === "active") return row.status === "active" || row.status === "ready";
        if (statusFilter === "draft") return row.status === "draft";
        if (statusFilter === "archived") return row.status === "sold-out";
        return true;
      });
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((row) =>
        row.name.toLowerCase().includes(q) ||
        row.category?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [rows, statusFilter, searchQuery]);
  const deleteProductMutation = useDeleteProduct(bootstrap?.storeId ?? "");
  const updateProductMutation = useUpdateProduct(bootstrap?.storeId ?? "");

  const handleDelete = async (id: string) => {
    deleteProductMutation.mutate(id, {
      onError: (error) => {
        alert(error instanceof Error ? error.message : "Failed to delete product");
      },
    });
  };

  // const handleDraftChange = (product: ProductTableRow, field: EditableField, value: string) => {
  //   setDrafts((prev) => ({
  //     ...prev,
  //     [product.id]: {
  //       ...prev[product.id],
  //       [field]: value,
  //     },
  //   }));
  // };

  // const handleInlineSave = async (id: string) => {
  //   const draft = drafts[id];
  //   if (!draft) {
  //     setActiveCell(null);
  //     return;
  //   }

  //   const payload: Partial<ProductApiRow> = {};
  //   if (draft.name !== undefined) payload.productName = draft.name;
  //   if (draft.priceAmount !== undefined) payload.priceAmount = Number(draft.priceAmount);
  //   if (draft.quantity !== undefined) payload.quantity = Number(draft.quantity);

  //   try {
  //     await updateProductMutation.mutateAsync({ id, data: payload });
  //     setDrafts((prev) => {
  //       const next = { ...prev };
  //       delete next[id];
  //       return next;
  //     });
  //   } catch (e) {
  //     console.error("Failed to update product", e);
  //   } finally {
  //     setActiveCell(null);
  //   }
  // };

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

  const handleBulkPublish = async () => {
    const selected = Object.keys(rowSelection);
    if (selected.length === 0) return;
    try {
      await Promise.all(
        selected.map((id) =>
          updateProductMutation.mutateAsync({
            id,
            data: { status: "ready" },
          })
        )
      );
      setRowSelection({});
    } catch (e) {
      console.error("Failed to publish products", e);
    }
  };

  const handleBulkDelete = async () => {
    const selected = Object.keys(rowSelection);
    if (selected.length === 0) return;
    if (confirm(`Are you sure you want to delete ${selected.length} products?`)) {
      try {
        await Promise.all(
          selected.map((id) => deleteProductMutation.mutateAsync(id))
        );
        setRowSelection({});
      } catch (e) {
        console.error("Failed to delete products", e);
      }
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
      size: 200,
      cell: ({ row }) => {
        const product = row.original;
        return (
          <div className="flex items-center gap-4 py-1">
            <div className="relative aspect-square size-12 shrink-0 overflow-hidden rounded-xl border bg-muted/20 shadow-sm">
              <ProductThumbnail url={product.thumbnailUrl} name={product.name} contentType={product.thumbnailType} />
            </div>
            <Link
              href={`/admin/${slug}/products/${product.id}`}
              className="font-medium text-sm tracking-tight capitalize hover:underline decoration-primary/30 truncate"
            >
              {product.name}
            </Link>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      size: 120,
      cell: ({ row }) => {
        const status = row.original.status;
        const colorMap = {
          active: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30",
          ready: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30",
          draft: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/20 dark:text-slate-400 dark:border-slate-500/30",
          "sold-out": "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30",
        };
        return (
          <span className={cn(
            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-tight",
            colorMap[status as keyof typeof colorMap] || "bg-muted text-muted-foreground border-border"
          )}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        );
      },
    },
    {
      accessorKey: "quantity",
      header: "Inventory",
      size: 140,
      cell: ({ row }) => {
        const quantity = Number(row.original.quantity);
        return (
          <span className={cn(
            "text-sm font-medium tracking-tight whitespace-nowrap",
            quantity === 0 ? "text-rose-600 font-medium" : "text-muted-foreground"
          )}>
            {quantity} in stock
          </span>
        );
      },
    },
    {
      accessorKey: "category",
      header: "Category",
      size: 140,
      cell: ({ row }) => (
        <span className="text-sm font-medium text-muted-foreground truncate max-w-[120px] block">
          {row.original.category || "—"}
        </span>
      ),
    },
    {
      accessorKey: "salesAmount",
      header: "Sales",
      size: 100,
      cell: ({ row }) => (
        <span className="text-sm font-medium text-foreground/80">
          {row.original.salesAmount || 0}
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
        {/* Desktop-only Header */}
        <div className="hidden md:flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Products</h1>
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
                <DropdownMenuItem onClick={handleBulkPublish}>
                  <HugeiconsIcon icon={Tick01Icon} className="mr-2 size-4 text-primary" />
                  Publish Selected
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={handleBulkDelete}>
                  <HugeiconsIcon icon={Delete02Icon} className="mr-2 size-4" />
                  Delete Selected
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Link href={`/admin/${slug}/products/new`}>
              <Button size="sm" className="h-8 gap-1.5 text-xs font-medium text-background hover:bg-primary/90 shadow-sm">
                <HugeiconsIcon icon={Add01Icon} className="size-4" />
                Add product
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards Grid - Hidden on mobile, shown on medium screens and up */}
        <div className="hidden md:grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total", value: rows.length },
            { label: "Active", value: rows.filter(r => r.status === "ready").length },
            { label: "Drafts", value: rows.filter(r => r.status === "draft").length },
            { label: "Out of Stock", value: rows.filter(r => r.quantity === 0).length }
          ].map((stat, i) => (
            <div key={i} className="flex flex-col gap-1 rounded-2xl border border-border/60 bg-white px-6 py-4 shadow-sm">
              <span className="text-[11px] font-bold text-muted-foreground uppercase leading-tight tracking-wider">{stat.label}</span>
              <span className="text-xl font-bold leading-none">{stat.value}</span>
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

        {/* Desktop Table Content - Hidden on mobile */}
        <div className="hidden md:flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm">
          <div className="flex flex-col gap-3 p-2 sm:flex-row sm:items-center justify-between border-b border-border/40 bg-muted/5">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar px-1">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setStatusFilter("all")}
                className={cn(
                  "h-9 text-xs font-medium px-4 transition-all rounded-lg",
                  statusFilter === "all" ? "bg-white border border-border/40 shadow-sm" : "hover:bg-muted/30"
                )}
              >
                All
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setStatusFilter("active")}
                className={cn(
                  "h-9 text-xs font-medium px-3 transition-all rounded-lg",
                  statusFilter === "active" ? "bg-white border border-border/40 shadow-sm" : "hover:bg-muted/30"
                )}
              >
                Active
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setStatusFilter("draft")}
                className={cn(
                  "h-9 text-xs font-medium px-3 transition-all rounded-lg",
                  statusFilter === "draft" ? "bg-white border border-border/40 shadow-sm" : "hover:bg-muted/30"
                )}
              >
                Draft
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setStatusFilter("archived")}
                className={cn(
                  "h-9 text-xs font-medium px-3 transition-all rounded-lg",
                  statusFilter === "archived" ? "bg-white border border-border/40 shadow-sm" : "hover:bg-muted/30"
                )}
              >
                Archived
              </Button>
            </div>
            
            <div className="flex items-center gap-2 px-1">
              <div className="relative flex-1 sm:w-72">
                <HugeiconsIcon icon={Search01Icon} className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input 
                  placeholder="Search products..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 pl-9 text-xs border border-border/60 bg-white/80 focus-visible:ring-1 focus-visible:ring-primary/20 shadow-none w-full font-medium rounded-lg" 
                />
              </div>
            </div>
          </div>

          <DataTable
            columns={columns}
            data={filteredRows}
            getRowId={(row) => row.id}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            className="border-none shadow-none"
          />
        </div>

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