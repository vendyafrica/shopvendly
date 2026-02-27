"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
    MoreHorizontalIcon,
    Edit02Icon,
    Delete02Icon,
    SparklesIcon,
} from "@hugeicons/core-free-icons";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@shopvendly/ui/components/table";
import { Badge } from "@shopvendly/ui/components/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@shopvendly/ui/components/dropdown-menu";
import Image from "next/image";

export type ProductStatus = "draft" | "ready" | "active" | "sold-out";

export interface ProductTableRow {
    id: string;
    productName: string;
    priceAmount: number;
    currency: string;
    quantity: number;
    status: ProductStatus;
    thumbnailUrl?: string;
    hasContentVariants: boolean;
    salesAmount?: number;
}

interface ProductTableProps {
    products: ProductTableRow[];
    selectedIds?: string[];
    onSelectionChange?: (ids: string[]) => void;
    onEdit?: (id: string) => void;
    onDelete?: (id: string) => void;
    onGenerateVariants?: (id: string) => void;
    isLoading?: boolean;
}

function formatPrice(amount: number, currency: string): string {
    return new Intl.NumberFormat("en-KE", {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
    }).format(amount);
}

function StatusBadge({ status }: { status: ProductStatus }) {
    const variants: Record<ProductStatus, { label: string; className: string }> = {
        draft: {
            label: "Draft",
            className: "bg-muted text-muted-foreground border-dashed",
        },
        ready: {
            label: "Ready",
            className: "bg-amber-50 text-amber-700 border-amber-100",
        },
        active: {
            label: "Published",
            className: "bg-emerald-50 text-emerald-700 border-emerald-100",
        },
        "sold-out": {
            label: "Sold Out",
            className: "bg-rose-50 text-rose-700 border-rose-100",
        },
    };

    const { label, className } = variants[status];

    return (
        <Badge variant="outline" className={`px-2.5 py-1 text-xs font-medium ${className}`}>
            {label}
        </Badge>
    );
}

function ProductActions({
    productId,
    onEdit,
    onDelete,
    onGenerateVariants,
}: {
    productId: string;
    onEdit?: (id: string) => void;
    onDelete?: (id: string) => void;
    onGenerateVariants?: (id: string) => void;
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger>
                <button
                    type="button"
                    className="inline-flex items-center justify-center size-8 rounded-md border border-border/60 bg-card hover:bg-muted/70 cursor-pointer shrink-0 transition-colors"
                >
                    <HugeiconsIcon icon={MoreHorizontalIcon} className="size-4" />
                    <span className="sr-only">Actions</span>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-44">
                <DropdownMenuItem onClick={() => onEdit?.(productId)} className="p-2 cursor-pointer">
                    <HugeiconsIcon icon={Edit02Icon} className="size-4" />
                    Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onGenerateVariants?.(productId)} className="p-2 cursor-pointer">
                    <HugeiconsIcon icon={SparklesIcon} className="size-4" />
                    Generate Variants
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    variant="destructive"
                    onClick={() => onDelete?.(productId)}
                    className="p-2 cursor-pointer"
                >
                    <HugeiconsIcon icon={Delete02Icon} className="size-4" />
                    Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function TableSkeleton() {
    return (
        <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 rounded-lg border border-dashed border-border/60 p-3 bg-muted/30">
                    <div className="size-10 bg-muted rounded-md animate-pulse shrink-0" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-1/3 animate-pulse" />
                        <div className="h-4 bg-muted rounded w-24 animate-pulse" />
                    </div>
                    <div className="h-4 bg-muted rounded w-16 animate-pulse shrink-0" />
                    <div className="h-4 bg-muted rounded w-12 animate-pulse shrink-0" />
                    <div className="h-4 bg-muted rounded w-16 animate-pulse shrink-0" />
                    <div className="h-6 bg-muted rounded w-20 animate-pulse shrink-0" />
                    <div className="size-8 bg-muted rounded animate-pulse shrink-0" />
                </div>
            ))}
        </div>
    );
}

export function ProductTable({
    products,
    selectedIds = [],
    onSelectionChange,
    onEdit,
    onDelete,
    onGenerateVariants,
    isLoading = false,
}: ProductTableProps) {
    if (isLoading) {
        return <TableSkeleton />;
    }

    if (products.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/70 bg-muted/40 py-10 text-center">
                <p className="text-base font-medium text-foreground">No products yet</p>
                <p className="text-muted-foreground text-sm mt-1">
                    Add your first product to get started.
                </p>
            </div>
        );
    }

    const allSelected = products.length > 0 && selectedIds.length === products.length;
    const isIndeterminate = selectedIds.length > 0 && selectedIds.length < products.length;

    const handleSelectAll = () => {
        if (allSelected) {
            onSelectionChange?.([]);
        } else {
            onSelectionChange?.(products.map(p => p.id));
        }
    };

    const handleSelectOne = (id: string) => {
        if (selectedIds.includes(id)) {
            onSelectionChange?.(selectedIds.filter(s => s !== id));
        } else {
            onSelectionChange?.([...selectedIds, id]);
        }
    };

    return (
        <Table className="w-full text-sm">
            <TableHeader>
                <TableRow>
                    <TableHead className="w-12 shrink-0">
                        <input
                            type="checkbox"
                            className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
                            checked={allSelected}
                            ref={input => {
                                if (input) input.indeterminate = isIndeterminate;
                            }}
                            onChange={handleSelectAll}
                        />
                    </TableHead>
                    <TableHead className="w-16 shrink-0">Image</TableHead>
                    <TableHead className="w-[32%]">Name</TableHead>
                    <TableHead className="w-[18%] min-w-[120px] shrink-0">Price</TableHead>
                    <TableHead className="w-[10%] min-w-[80px] shrink-0">Qty</TableHead>
                    <TableHead className="w-[15%] min-w-[110px] shrink-0">Sales</TableHead>
                    <TableHead className="w-[15%] min-w-[110px] shrink-0">Status</TableHead>
                    <TableHead className="w-16 shrink-0">Actions</TableHead>
                </TableRow>
            </TableHeader>

            <TableBody>
                {products.map((product) => {
                    const isSelected = selectedIds.includes(product.id);
                    return (
                        <TableRow key={product.id} className="hover:bg-muted/40">
                            <TableCell className="shrink-0">
                                <input
                                    type="checkbox"
                                    className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    checked={isSelected}
                                    onChange={() => handleSelectOne(product.id)}
                                />
                            </TableCell>
                            <TableCell className="shrink-0">
                                <div className="relative size-10 overflow-hidden rounded-md bg-muted">
                                    {product.thumbnailUrl ? (
                                        <Image
                                            src={product.thumbnailUrl}
                                            alt={product.productName}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="flex size-full items-center justify-center text-muted-foreground text-xs">
                                            N/A
                                        </div>
                                    )}
                                </div>
                            </TableCell>

                            <TableCell className="font-medium max-w-[320px]">
                                <div
                                    className="truncate"
                                    title={product.productName}
                                >
                                    {product.productName}
                                </div>
                            </TableCell>

                            <TableCell className="shrink-0 whitespace-nowrap">
                                {formatPrice(product.priceAmount, product.currency)}
                            </TableCell>

                            <TableCell className="shrink-0 whitespace-nowrap">
                                {product.quantity}
                            </TableCell>

                            <TableCell className="shrink-0 whitespace-nowrap">
                                {formatPrice(product.salesAmount || 0, product.currency)}
                            </TableCell>

                            <TableCell className="shrink-0">
                                <StatusBadge status={product.status} />
                            </TableCell>

                            <TableCell className="shrink-0">
                                <ProductActions
                                    productId={product.id}
                                    onEdit={onEdit}
                                    onDelete={onDelete}
                                    onGenerateVariants={onGenerateVariants}
                                />
                            </TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
}
