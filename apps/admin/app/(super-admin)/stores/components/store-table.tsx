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
import { MoreHorizontalIcon, StarIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { format } from "date-fns";

export interface Store {
    id: string;
    name: string;
    slug: string;
    tenantName: string;
    storeRating: number;
    status: boolean;
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
    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Loading stores...</div>;
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Store Name</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Domain</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="w-[70px]"></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {stores.map((store) => (
                    <TableRow key={store.id}>
                        <TableCell className="font-medium">
                            <div className="flex flex-col">
                                <span>{store.name}</span>
                                <span className="text-xs text-muted-foreground">/{store.slug}</span>
                            </div>
                        </TableCell>
                        <TableCell>{store.tenantName}</TableCell>
                        <TableCell>
                            {store.customDomain ? (
                                <Badge variant="outline">{store.customDomain}</Badge>
                            ) : (
                                <span className="text-muted-foreground text-sm">-</span>
                            )}
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center gap-1">
                                <HugeiconsIcon icon={StarIcon} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span>{store.storeRating || 0}</span>
                            </div>
                        </TableCell>
                        <TableCell>
                            <Badge
                                variant={store.status ? "primary" : "secondary"}
                                className="capitalize"
                            >
                                {store.status ? "Active" : "Inactive"}
                            </Badge>
                        </TableCell>
                        <TableCell>
                            <div className="flex flex-col text-sm">
                                <span>{store.storeContactPhone || "-"}</span>
                            </div>
                        </TableCell>
                        <TableCell>
                            {format(new Date(store.createdAt), "MMM d, yyyy")}
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
                                    <DropdownMenuItem>View Storefront</DropdownMenuItem>
                                    <DropdownMenuItem>View Details</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
