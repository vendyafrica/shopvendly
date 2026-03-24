"use client";

import * as React from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@shopvendly/ui/components/table";
import { Input } from "@shopvendly/ui/components/input";
import { Edit02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

export interface Store {
    id: string;
    name: string;
    slug: string;
    tenantName: string;
    tenantPhone?: string | null;
    storeRating: number;
    status: boolean;
    deliveryProviderPhone: string | null;
    storeContactPhone: string | null;
    storeAddress: string | null;
    customDomain: string | null;
    createdAt: string;
}

interface StoreTableProps {
    stores: Store[];
    isLoading: boolean;
}

export function StoreTable({ stores, isLoading }: StoreTableProps) {
    const router = useRouter();
    const [saveMessage ] = React.useState<string | null>(null);

    const [activeCell, setActiveCell] = React.useState<{
        id: string;
        field: "name" | "slug" | "deliveryProviderPhone";
    } | null>(null);
    const [drafts, setDrafts] = React.useState<Record<string, string>>({});
    const [localStores, setLocalStores] = React.useState(stores);

    React.useEffect(() => {
        setLocalStores(stores);
    }, [stores]);

    const handleInlineSave = async (storeId: string, field: "name" | "slug" | "deliveryProviderPhone") => {
        const draftValue = drafts[storeId];
        if (!draftValue || !draftValue.trim()) {
            setActiveCell(null);
            return;
        }

        try {
            const res = await fetch(`/api/stores/${encodeURIComponent(storeId)}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ [field]: draftValue.trim() }),
            });

            if (!res.ok) throw new Error("Failed to save");

            // Optimistically update local UI while router refreshes
            setLocalStores((prev) =>
                prev.map((s) => (s.id === storeId ? { ...s, [field]: draftValue.trim() } : s))
            );

            setDrafts((prev) => {
                const next = { ...prev };
                delete next[storeId];
                return next;
            });
            setActiveCell(null);
            router.refresh();
        } catch (error) {
            alert(error instanceof Error ? error.message : "Failed to save");
            setActiveCell(null);
        }
    };

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Loading stores...</div>;
    }

    return (
        <div className="space-y-3">
            {saveMessage ? (
                <div className="px-4 pt-3 text-sm text-muted-foreground">{saveMessage}</div>
            ) : null}

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Store Name</TableHead>
                        <TableHead>Tenant</TableHead>
                        <TableHead>Domain</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Delivery Partner</TableHead>
                        <TableHead>Created At</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {localStores.map((store) => {
                        const isEditingName = activeCell?.id === store.id && activeCell.field === "name";
                        const nameValue = drafts[store.id] ?? store.name;

                        return (
                            <TableRow key={store.id}>
                                <TableCell className="font-medium align-top">
                                    {isEditingName ? (
                                        <Input
                                            autoFocus
                                            value={nameValue}
                                            onChange={(e) => setDrafts(prev => ({ ...prev, [store.id]: e.target.value }))}
                                            onBlur={() => handleInlineSave(store.id, "name")}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") handleInlineSave(store.id, "name");
                                                if (e.key === "Escape") {
                                                    setDrafts(prev => { const next = { ...prev }; delete next[store.id]; return next; });
                                                    setActiveCell(null);
                                                }
                                            }}
                                            className="h-9 w-full min-w-[150px]"
                                        />
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setActiveCell({ id: store.id, field: "name" })}
                                            className="group flex items-center gap-2 capitalize text-left hover:bg-muted/50 p-1 -ml-1 rounded-md transition-colors w-full"
                                        >
                                            <span>{nameValue}</span>
                                            <HugeiconsIcon icon={Edit02Icon} className="size-3.5 opacity-0 group-hover:opacity-100 text-muted-foreground transition-opacity shrink-0" />
                                        </button>
                                    )}
                                </TableCell>
                                <TableCell className="capitalize">{store.tenantName}</TableCell>
                                <TableCell className="whitespace-normal break-all min-w-[200px] max-w-[300px]">
                                    {activeCell?.id === store.id && activeCell.field === "slug" ? (
                                        <Input
                                            autoFocus
                                            value={drafts[store.id] ?? store.slug}
                                            onChange={(e) => setDrafts(prev => ({ ...prev, [store.id]: e.target.value }))}
                                            onBlur={() => handleInlineSave(store.id, "slug")}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") handleInlineSave(store.id, "slug");
                                                if (e.key === "Escape") {
                                                    setDrafts(prev => { const next = { ...prev }; delete next[store.id]; return next; });
                                                    setActiveCell(null);
                                                }
                                            }}
                                            className="h-9 w-full"
                                        />
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setActiveCell({ id: store.id, field: "slug" })}
                                            className="group inline-flex items-center gap-2 text-left hover:bg-muted/50 px-1 py-0.5 -ml-1 rounded-md transition-colors w-full"
                                        >
                                            <a
                                                href={`https://shopvendly.store/${store.slug}`}
                                                className="text-sm text-primary underline-offset-4 group-hover:underline break-all"
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                {`https://shopvendly.store/${store.slug}`}
                                            </a>
                                            <HugeiconsIcon icon={Edit02Icon} className="size-3.5 opacity-0 group-hover:opacity-100 text-muted-foreground transition-opacity shrink-0" />
                                        </button>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col text-sm">
                                        <span>{store.tenantPhone || store.storeContactPhone || "-"}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="font-medium align-top">
                                    {activeCell?.id === store.id && activeCell.field === "deliveryProviderPhone" ? (
                                        <Input
                                            autoFocus
                                            value={drafts[store.id] ?? store.deliveryProviderPhone ?? ""}
                                            onChange={(e) => setDrafts(prev => ({ ...prev, [store.id]: e.target.value }))}
                                            onBlur={() => handleInlineSave(store.id, "deliveryProviderPhone")}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") handleInlineSave(store.id, "deliveryProviderPhone");
                                                if (e.key === "Escape") {
                                                    setDrafts(prev => { const next = { ...prev }; delete next[store.id]; return next; });
                                                    setActiveCell(null);
                                                }
                                            }}
                                            placeholder="+2567..."
                                            className="h-9 w-full min-w-[150px]"
                                        />
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setActiveCell({ id: store.id, field: "deliveryProviderPhone" })}
                                            className="group flex flex-col text-left hover:bg-muted/50 p-1 -ml-1 rounded-md transition-colors w-full"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span>{store.deliveryProviderPhone || "-"}</span>
                                                <HugeiconsIcon icon={Edit02Icon} className="size-3.5 opacity-0 group-hover:opacity-100 text-muted-foreground transition-opacity shrink-0" />
                                            </div>
                                        </button>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {format(new Date(store.createdAt), "MMM d, yyyy")}
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div >
    );
}
