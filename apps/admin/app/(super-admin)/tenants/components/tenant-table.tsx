"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@shopvendly/ui/components/table";
import { Badge } from "@shopvendly/ui/components/badge";
import { Input } from "@shopvendly/ui/components/input";
import { Edit02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@shopvendly/ui/lib/utils";
import { format } from "date-fns";
import { Skeleton } from "@shopvendly/ui/components/skeleton";
import * as React from "react";
import { useRouter } from "next/navigation";

export interface Tenant {
    id: string;
    fullName: string;
    slug: string;
    phoneNumber?: string | null;
    status: string;
    plan?: string | null;
    billingEmail?: string | null;
    createdAt: string;
}

interface TenantTableProps {
    tenants: Tenant[];
    isLoading: boolean;
}

export function TenantTable({ tenants, isLoading }: TenantTableProps) {
    const router = useRouter();
    const [activeCell, setActiveCell] = React.useState<{ id: string; field: "fullName" } | null>(null);
    const [drafts, setDrafts] = React.useState<Record<string, string>>({});
    const [localTenants, setLocalTenants] = React.useState(tenants);

    React.useEffect(() => {
        setLocalTenants(tenants);
    }, [tenants]);

    const handleInlineSave = async (tenantId: string, field: "fullName") => {
        const draftValue = drafts[tenantId];
        if (!draftValue || !draftValue.trim()) {
            setActiveCell(null);
            return;
        }

        try {
            const res = await fetch(`/api/tenants/${encodeURIComponent(tenantId)}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ [field]: draftValue.trim() }),
            });

            if (!res.ok) throw new Error("Failed to save");

            // Optimistically update local UI
            setLocalTenants((prev) =>
                prev.map((t) => (t.id === tenantId ? { ...t, [field]: draftValue.trim() } : t))
            );

            setDrafts((prev) => {
                const next = { ...prev };
                delete next[tenantId];
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
        return (
            <Table>
                <TableHeader className="bg-muted/30">
                    <TableRow className="hover:bg-transparent">
                        <TableHead><Skeleton className="h-3 w-24" /></TableHead>
                        <TableHead><Skeleton className="h-3 w-16" /></TableHead>
                        <TableHead><Skeleton className="h-3 w-20" /></TableHead>
                        <TableHead><Skeleton className="h-3 w-24" /></TableHead>
                        <TableHead><Skeleton className="h-3 w-32" /></TableHead>
                        <TableHead><Skeleton className="h-3 w-20" /></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {[1, 2, 3, 4, 5].map((i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        );
    }

    return (
        <Table>
            <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent border-b border-border/70">
                    <TableHead className="text-xs font-medium text-muted-foreground">Full Name</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Plan</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Billing Email</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Phone</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Status</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Created At</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {localTenants.map((tenant) => {
                    const isEditingName = activeCell?.id === tenant.id && activeCell.field === "fullName";
                    const nameValue = drafts[tenant.id] ?? tenant.fullName;

                    return (
                        <TableRow key={tenant.id} className="hover:bg-muted/30 transition-colors border-b border-border/50 last:border-0">
                            <TableCell className="font-medium text-foreground">
                                {isEditingName ? (
                                    <Input
                                        autoFocus
                                        value={nameValue}
                                        onChange={(e) => setDrafts(prev => ({ ...prev, [tenant.id]: e.target.value }))}
                                        onBlur={() => handleInlineSave(tenant.id, "fullName")}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") handleInlineSave(tenant.id, "fullName");
                                            if (e.key === "Escape") {
                                                setDrafts(prev => { const next = { ...prev }; delete next[tenant.id]; return next; });
                                                setActiveCell(null);
                                            }
                                        }}
                                        className="h-9 w-full min-w-[150px]"
                                    />
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => setActiveCell({ id: tenant.id, field: "fullName" })}
                                        className="group flex items-center gap-2 capitalize text-left hover:bg-muted/50 p-1 -ml-1 rounded-md transition-colors w-full"
                                    >
                                        <span>{nameValue}</span>
                                        <HugeiconsIcon icon={Edit02Icon} className="size-3.5 opacity-0 group-hover:opacity-100 text-muted-foreground transition-opacity shrink-0" />
                                    </button>
                                )}
                            </TableCell>
                            <TableCell>
                                <Badge
                                    variant="outline"
                                    className="px-2 py-0.5 rounded-full text-[10px] font-bold border-0 uppercase tracking-wider bg-primary/10 text-primary hover:bg-primary/20"
                                >
                                    {tenant.plan || "Free"}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{tenant.billingEmail || "-"}</TableCell>
                            <TableCell className="text-muted-foreground font-medium">{tenant.phoneNumber || "-"}</TableCell>
                            <TableCell>
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        "px-2 py-0.5 rounded-full text-[10px] font-bold border-0 uppercase tracking-wider",
                                        tenant.status === "active"
                                            ? "bg-emerald-100 text-emerald-800"
                                            : "bg-amber-100 text-amber-800"
                                    )}
                                >
                                    {tenant.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                                {format(new Date(tenant.createdAt), "MMM d, yyyy")}
                            </TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
}
