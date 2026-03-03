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
import { Button } from "@shopvendly/ui/components/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@shopvendly/ui/components/dropdown-menu";
import { Input } from "@shopvendly/ui/components/input";
import { MoreHorizontalIcon, Edit02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { format } from "date-fns";
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
        return <div className="p-8 text-center text-muted-foreground">Loading tenants...</div>;
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Billing Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created At</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {localTenants.map((tenant) => {
                    const isEditingName = activeCell?.id === tenant.id && activeCell.field === "fullName";
                    const nameValue = drafts[tenant.id] ?? tenant.fullName;

                    return (
                        <TableRow key={tenant.id}>
                            <TableCell className="font-medium">
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
                                        className="group flex flex-col capitalize text-left hover:bg-muted/50 p-1 -ml-1 rounded-md transition-colors w-full"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span>{nameValue}</span>
                                            <HugeiconsIcon icon={Edit02Icon} className="size-3.5 opacity-0 group-hover:opacity-100 text-muted-foreground transition-opacity shrink-0" />
                                        </div>
                                    </button>
                                )}
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline" className="capitalize">
                                    {tenant.plan || "Free"}
                                </Badge>
                            </TableCell>
                            <TableCell>{tenant.billingEmail || "-"}</TableCell>
                            <TableCell>{tenant.phoneNumber || "-"}</TableCell>
                            <TableCell>
                                <Badge
                                    variant={tenant.status === "active" ? "primary" : "secondary"}
                                    className="capitalize"
                                >
                                    {tenant.status}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                {format(new Date(tenant.createdAt), "MMM d, yyyy")}
                            </TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
}
