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
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@shopvendly/ui/components/dropdown-menu";
import { MoreHorizontalIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { format } from "date-fns";

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
                    <TableHead className="w-[70px]"></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {tenants.map((tenant) => (
                    <TableRow key={tenant.id}>
                        <TableCell className="font-medium">
                            <div className="flex flex-col">
                                <span>{tenant.fullName}</span>
                                <span className="text-xs text-muted-foreground">ID: {tenant.id.slice(0, 8)}...</span>
                            </div>
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
                                variant={tenant.status === "active" ? "default" : "secondary"}
                                className="capitalize"
                            >
                                {tenant.status}
                            </Badge>
                        </TableCell>
                        <TableCell>
                            {format(new Date(tenant.createdAt), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                            <DropdownMenu>
                                <DropdownMenuTrigger>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                        <HugeiconsIcon icon={MoreHorizontalIcon} className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuItem>View Details</DropdownMenuItem>
                                    <DropdownMenuItem>Edit Tenant</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
