"use client";

import * as React from "react";
import Image from "next/image";
import { useTenant } from "@/modules/admin/context/tenant-context";
import { DataTable } from "@/modules/admin/components/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@shopvendly/ui/components/button";
import { Input } from "@shopvendly/ui/components/input";
import { Checkbox } from "@shopvendly/ui/components/checkbox";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  Delete02Icon, 
  Link01Icon,
  Search01Icon,
  Add01Icon,
} from "@hugeicons/core-free-icons";
import { AddCollectionButton } from "./components/add-collection-button";
import { UploadCollectionModal } from "./components/upload-collection-modal";
import { AssignProductsModal } from "./components/assign-products-modal";
import { 
  type CollectionRow, 
  type CollectionProductRow as ProductRow, 
  type MediaItem 
} from "@/modules/admin/models";
import { cn } from "@shopvendly/ui/lib/utils";

function CollectionThumbnail({
  url,
  name,
}: {
  url?: string | null;
  name: string;
}) {
  const [forceVideo, setForceVideo] = React.useState(false);

  if (!url) {
    return <div className="flex size-full items-center justify-center text-xs text-muted-foreground bg-muted/30">N/A</div>;
  }

  const isVideo = forceVideo || url.match(/\.(mp4|webm|ogg)$/i);

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

export default function CollectionsPage() {
  const { bootstrap, error: bootstrapError } = useTenant();

  const [collections, setCollections] = React.useState<CollectionRow[]>([]);
  const [products, setProducts] = React.useState<ProductRow[]>([]);
  const [productsLoading, setProductsLoading] = React.useState(false);
  const [productsError, setProductsError] = React.useState<string | null>(null);

  const [loading, setLoading] = React.useState(true);
  const [uploadModalOpen, setUploadModalOpen] = React.useState(false);
  const [assignModalOpen, setAssignModalOpen] = React.useState(false);

  const [selectedCollectionId, setSelectedCollectionId] = React.useState<string | null>(null);
  const [selectedCollectionName, setSelectedCollectionName] = React.useState<string>("");
  const [selectedProductIds, setSelectedProductIds] = React.useState<Set<string>>(new Set());

  const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = React.useState("");

  const storeId = bootstrap?.storeId;

  const loadCollections = React.useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ storeId });
      const res = await fetch(`/api/store-collections?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load collections");
      const result = await res.json();
      const data = (result.data ?? result) as CollectionRow[];
      setCollections(data);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  const loadProducts = React.useCallback(async () => {
    if (!storeId) {
      setProducts([]);
      setProductsError("Store not ready.");
      return;
    }

    setProductsLoading(true);
    setProductsError(null);

    try {
      const res = await fetch(`/api/products?storeId=${storeId}&page=1&limit=100`, { cache: "no-store" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to load products");
      }

      const jsonResult = await res.json();
      const json = (jsonResult.data ?? jsonResult) as {
        products: Array<{
          id: string;
          productName: string;
          media?: Array<{ blobUrl: string; contentType?: string | null }>;
        }>;
      };

      setProducts(
        (json.products || []).map((product) => ({
          id: product.id,
          productName: product.productName,
          thumbnailUrl: product.media?.[0]?.blobUrl ?? null,
          thumbnailType: product.media?.[0]?.contentType ?? null,
        }))
      );
    } catch (error) {
      console.error("Error loading products for collections:", error);
      setProducts([]);
      setProductsError(error instanceof Error ? error.message : "Failed to load products");
    } finally {
      setProductsLoading(false);
    }
  }, [storeId]);

  React.useEffect(() => {
    void loadCollections();
  }, [loadCollections]);

  React.useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const handleCreate = async (name: string, media?: MediaItem) => {
    if (!storeId || !name.trim()) return;
    const res = await fetch("/api/store-collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storeId,
        name: name.trim(),
        image: media?.url ? media.url : null,
      }),
    });

    if (!res.ok) throw new Error("Failed to create collection");
    await loadCollections();
  };

  const handleDelete = async (collectionId: string) => {
    if (!confirm("Delete this collection?")) return;

    await fetch(`/api/store-collections/${collectionId}`, { method: "DELETE" });
    if (selectedCollectionId === collectionId) {
      setSelectedCollectionId(null);
      setSelectedProductIds(new Set());
      setAssignModalOpen(false);
    }
    await loadCollections();
  };

  const handleOpenAssign = async (collectionId: string, name: string) => {
    setSelectedCollectionId(collectionId);
    setSelectedCollectionName(name);

    setAssignModalOpen(true);

    if (products.length === 0 || productsError) {
      await loadProducts();
    }

    const res = await fetch(`/api/store-collections/${collectionId}/products`, { cache: "no-store" });
    if (!res.ok) {
      setSelectedProductIds(new Set());
      return;
    }
    const collResult = await res.json();
    const data = (collResult.data ?? collResult) as { productIds: string[] };
    setSelectedProductIds(new Set(data.productIds || []));
  };

  const handleSaveAssignments = async (collectionId: string, productIds: string[]) => {
    await fetch(`/api/store-collections/${collectionId}/products`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productIds }),
    });
    await loadCollections();
  };

  const filteredCollections = React.useMemo(() => {
    if (!searchQuery) return collections;
    const q = searchQuery.toLowerCase();
    return collections.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.slug.toLowerCase().includes(q)
    );
  }, [collections, searchQuery]);

  const columns: ColumnDef<CollectionRow>[] = [
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
    },
    {
      accessorKey: "name",
      header: "Collection",
      size: 240,
      cell: ({ row }) => {
        const collection = row.original;
        return (
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative size-12 overflow-hidden rounded-xl border bg-muted shrink-0 shadow-sm">
              <CollectionThumbnail
                url={collection.image}
                name={collection.name}
              />
            </div>
            <div className="min-w-0 flex-1">
              <span className="font-semibold block truncate capitalize">{collection.name}</span>
              <p className="text-[11px] text-muted-foreground truncate hidden sm:block">/{collection.slug}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "productCount",
      header: "Products",
      size: 120,
      cell: ({ row }) => {
        return <span className="text-sm font-medium text-muted-foreground">{row.original.productCount} product{row.original.productCount === 1 ? "" : "s"}</span>;
      },
    },
    {
      id: "actions",
      header: "Actions",
      size: 100,
      cell: ({ row }) => {
        const collection = row.original;

        return (
          <div className="flex items-center justify-end gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="px-2 h-8 text-xs font-semibold"
              onClick={() => handleOpenAssign(collection.id, collection.name)}
              aria-label="Assign products"
              title="Assign products"
            >
              <HugeiconsIcon icon={Link01Icon} className="size-4 mr-1.5 opacity-60" />
              Assign
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive px-2 h-8"
              onClick={() => handleDelete(collection.id)}
              aria-label="Delete collection"
              title="Delete collection"
            >
              <HugeiconsIcon icon={Delete02Icon} className="size-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  const totalCollections = collections.length;
  const totalAssignedProducts = collections.reduce((acc, curr) => acc + curr.productCount, 0);

  return (
    <div className="flex-1 space-y-4 px-4 py-4 md:px-8 md:py-6">
      <div className="flex flex-col gap-4">
        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Collections</h1>
            <p className="hidden text-xs text-muted-foreground sm:block">
              Create collections and assign products shown on storefront rails.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
                data-tour-step-id="admin-collections"
                onClick={() => setUploadModalOpen(true)}
                size="sm" 
                className="h-8 gap-1.5 text-xs font-medium text-background hover:bg-primary/90 shadow-sm"
            >
              <HugeiconsIcon icon={Add01Icon} className="size-4" />
              Add collection
            </Button>
          </div>
        </div>

        {/* Stats Cards Grid */}
        <div className="hidden md:grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total Collections", value: totalCollections.toLocaleString() },
            { label: "Assigned Products", value: totalAssignedProducts.toLocaleString() },
          ].map((stat, i) => (
            <div key={i} className="flex flex-col gap-1 rounded-2xl border border-border/60 bg-white px-6 py-4 shadow-sm">
              <span className="text-[11px] font-bold text-muted-foreground uppercase leading-tight tracking-wider">{stat.label}</span>
              <span className="text-xl font-bold leading-none">{stat.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-2 flex flex-col gap-4">
        {bootstrapError && (
          <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive border border-destructive/25 flex items-center gap-3">
            <HugeiconsIcon icon={Delete02Icon} className="size-5 shrink-0" />
            <div>
              <p className="font-semibold">Error loading store data</p>
              <p className="text-xs opacity-80">{bootstrapError}</p>
            </div>
          </div>
        )}

        {/* Desktop Table Content */}
        <div className="hidden md:flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm">
          <div className="flex flex-col gap-3 p-2 sm:flex-row sm:items-center justify-between border-b border-border/40 bg-muted/5">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar px-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className={cn(
                  "h-9 text-xs font-medium px-4 transition-all rounded-lg bg-white border border-border/40 shadow-sm"
                )}
              >
                All
              </Button>
            </div>
            
            <div className="flex items-center gap-2 px-1">
              <div className="relative flex-1 sm:w-72">
                <HugeiconsIcon icon={Search01Icon} className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input 
                  placeholder="Search collections..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 pl-9 text-xs border border-border/60 bg-white/80 focus-visible:ring-1 focus-visible:ring-primary/20 shadow-none w-full font-medium rounded-lg" 
                />
              </div>
            </div>
          </div>

          <div className="border-none shadow-none">
            <DataTable
              columns={columns}
              data={filteredCollections}
              getRowId={(row) => row.id}
              rowSelection={rowSelection}
              onRowSelectionChange={setRowSelection}
              className="border-none shadow-none"
            />
          </div>
        </div>

        {/* Mobile View */}
        <div className="md:hidden space-y-5 px-1 pb-24">
            <div className="space-y-4">
                <div>
                   <h1 className="text-3xl font-semibold tracking-tight">Collections</h1>
                   <p className="text-sm text-muted-foreground">Create collections and assign products shown on storefront rails.</p>
                </div>
                <AddCollectionButton onSelect={() => setUploadModalOpen(true)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
                {loading && collections.length === 0 ? (
                    [1, 2, 3, 4].map((i) => (
                        <div key={i} className="aspect-[0.9] rounded-2xl bg-muted animate-pulse" />
                    ))
                ) : collections.length === 0 ? (
                    <div className="col-span-2 rounded-2xl border border-dashed border-border/60 bg-muted/20 px-4 py-12 text-center text-sm text-muted-foreground">
                        No collections yet. Tap Add Collection to create one.
                    </div>
                ) : (
                    filteredCollections.map((collection) => (
                        <button
                            key={collection.id}
                            type="button"
                            className="group relative aspect-[0.9] overflow-hidden rounded-2xl bg-muted text-left"
                            onClick={() => handleOpenAssign(collection.id, collection.name)}
                        >
                            <CollectionThumbnail url={collection.image} name={collection.name} />
                            <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/20 to-transparent" />
                            <div className="absolute inset-x-0 bottom-0 p-3">
                                <p className="truncate text-sm font-semibold text-white">{collection.name}</p>
                                <p className="mt-1 text-[11px] font-medium text-white/85">{collection.productCount} product{collection.productCount === 1 ? "" : "s"}</p>
                            </div>
                        </button>
                    ))
                )}
            </div>
        </div>
      </div>

      <UploadCollectionModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        tenantId={bootstrap?.tenantId || ""}
        onCreate={handleCreate}
      />

      <AssignProductsModal
        open={assignModalOpen}
        onOpenChange={setAssignModalOpen}
        collectionId={selectedCollectionId}
        collectionName={selectedCollectionName}
        products={products}
        productsLoading={productsLoading}
        productsError={productsError}
        initialSelectedProductIds={selectedProductIds}
        onSave={handleSaveAssignments}
      />
    </div>
  );
}
