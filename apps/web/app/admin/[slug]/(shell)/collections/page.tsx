"use client";

import * as React from "react";
import Image from "next/image";
import { useTenant } from "@/app/admin/context/tenant-context";
import { SegmentedStatsCard } from "@/app/admin/components/segmented-stats-card";
import { DataTable } from "@/app/admin/components/data-table";
import type { ColumnDef } from "@tanstack/react-table";

import { Button } from "@shopvendly/ui/components/button";
import { Checkbox } from "@shopvendly/ui/components/checkbox";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon, Link01Icon } from "@hugeicons/core-free-icons";

import { AddCollectionButton } from "./components/add-collection-button";
import { UploadCollectionModal, type MediaItem } from "./components/upload-collection-modal";
import { AssignProductsModal } from "./components/assign-products-modal";

type CollectionRow = {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  productCount: number;
};

type ProductRow = {
  id: string;
  productName: string;
};

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
    if (!storeId) return;
    const res = await fetch(`/api/products?storeId=${storeId}&page=1&limit=200`, { cache: "no-store" });
    if (!res.ok) return;
    const json = (await res.json()) as { data: Array<{ id: string; productName: string }> };
    setProducts((json.data || []).map((product) => ({ id: product.id, productName: product.productName })));
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

  return (
    <div className="md:p-6 p-4 space-y-6">
      {bootstrapError ? (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">{bootstrapError}</div>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Collections</h1>
          <p className="text-sm text-muted-foreground">Create collections and assign products shown on storefront rails.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          {/* Can add bulk action buttons here safely later since checkbox selection works */}
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
        initialSelectedProductIds={selectedProductIds}
        onSave={handleSaveAssignments}
      />
    </div>
  );
}
