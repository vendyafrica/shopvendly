"use client";

import * as React from "react";
import Image from "next/image";
import { useTenant } from "@/modules/admin/context/tenant-context";
import { SegmentedStatsCard } from "@/modules/admin/components/segmented-stats-card";
import { DataTable } from "@/modules/admin/components/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@shopvendly/ui/components/button";
import { Checkbox } from "@shopvendly/ui/components/checkbox";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon, Link01Icon } from "@hugeicons/core-free-icons";
import { AddCollectionButton } from "./components/add-collection-button";
import { UploadCollectionModal } from "./components/upload-collection-modal";
import { AssignProductsModal } from "./components/assign-products-modal";
import { 
  type CollectionRow, 
  type CollectionProductRow as ProductRow, 
  type MediaItem 
} from "@/modules/admin/models";


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

  const storeId = bootstrap?.storeId;

  const loadCollections = React.useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ storeId });
      const res = await fetch(`/api/store-collections?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load collections");
      const data = (await res.json()) as CollectionRow[];
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

      const json = (await res.json()) as {
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

    // Optimistic UI updates could be added here, but simple for now
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

    // Open modal immediately for better UX
    setAssignModalOpen(true);

    if (products.length === 0 || productsError) {
      await loadProducts();
    }

    const res = await fetch(`/api/store-collections/${collectionId}/products`, { cache: "no-store" });
    if (!res.ok) {
      setSelectedProductIds(new Set());
      return;
    }
    const data = (await res.json()) as { productIds: string[] };
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

  const toggleAll = (checked: boolean) => {
    if (checked) {
      const next: Record<string, boolean> = {};
      collections.forEach((r) => {
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

  const selectedIds = React.useMemo(() => Object.keys(rowSelection), [rowSelection]);

  const columns: ColumnDef<CollectionRow>[] = [
    {
      id: "select",
      header: () => (
        <Checkbox
          aria-label="Select all"
          checked={selectedIds.length > 0 && selectedIds.length === collections.length}
          indeterminate={selectedIds.length > 0 && selectedIds.length < collections.length}
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
      header: "Collection",
      size: 240,
      cell: ({ row }) => {
        const collection = row.original;
        return (
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative size-10 overflow-hidden rounded-md bg-muted shrink-0">
              <CollectionThumbnail
                url={collection.image}
                name={collection.name}
              />
            </div>
            <div className="min-w-0 flex-1">
              <span className="font-semibold">{collection.name}</span>
              <p className="text-xs text-muted-foreground truncate hidden sm:block">/{collection.slug}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "productCount",
      header: "Products",
      size: 90,
      cell: ({ row }) => {
        return <span className="text-sm font-medium">{row.original.productCount}</span>;
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
              className="px-2"
              onClick={() => handleOpenAssign(collection.id, collection.name)}
              aria-label="Assign products"
              title="Assign products"
            >
              <HugeiconsIcon icon={Link01Icon} className="size-4" />
              <span className="hidden lg:inline ml-1">Assign</span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive px-2"
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

  const statSegments = [
    {
      label: "Total Collections",
      value: totalCollections.toLocaleString(),
      changeLabel: "",
      changeTone: "neutral" as const,
    },
    {
      label: "Assigned Products",
      value: totalAssignedProducts.toLocaleString(),
      changeLabel: "",
      changeTone: "neutral" as const,
    },
  ];

  const mobileCollectionCards = (
    <div className="grid grid-cols-2 gap-3">
      {collections.length === 0 ? (
        <div className="col-span-2 rounded-2xl border border-dashed border-border/60 bg-muted/20 px-4 py-12 text-center text-sm text-muted-foreground">
          No collections yet. Tap Add Collection to create one.
        </div>
      ) : (
        collections.map((collection) => (
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
  );

  return (
    <div className="md:p-6 p-0">
      <div className="block md:hidden px-4 py-4 space-y-5 pb-24">
        {bootstrapError ? (
          <div className="bg-destructive/10 text-destructive p-4 rounded-md text-sm">{bootstrapError}</div>
        ) : null}

        <div className="space-y-3 px-1">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Collections</h1>
            <p className="text-sm text-muted-foreground">Create collections and assign products shown on storefront rails.</p>
          </div>
          <AddCollectionButton onSelect={() => setUploadModalOpen(true)} />
        </div>

        <SegmentedStatsCard segments={statSegments} />

        {loading && collections.length === 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-[0.9] rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          mobileCollectionCards
        )}
      </div>

      <div className="hidden md:block space-y-6 p-4 md:p-0">
        {bootstrapError ? (
          <div className="bg-destructive/10 text-destructive p-4 rounded-md">{bootstrapError}</div>
        ) : null}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Collections</h1>
            <p className="text-sm text-muted-foreground">Create collections and assign products shown on storefront rails.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <AddCollectionButton
              onSelect={() => setUploadModalOpen(true)}
            />
          </div>
        </div>

        <SegmentedStatsCard segments={statSegments} />

        <div className="rounded-md border bg-card p-3 overflow-hidden min-w-0">
          {loading && collections.length === 0 ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 rounded-lg border border-dashed border-border/60 p-3 bg-muted/30">
                  <div className="size-10 bg-muted rounded-md animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/3 animate-pulse" />
                    <div className="h-4 bg-muted rounded w-24 animate-pulse" />
                  </div>
                  <div className="h-8 bg-muted rounded w-16 animate-pulse shrink-0" />
                </div>
              ))}
            </div>
          ) : (
            <DataTable
              className="table-fixed"
              columns={columns}
              data={collections}
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
