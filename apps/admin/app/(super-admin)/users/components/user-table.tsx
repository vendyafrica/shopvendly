"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@shopvendly/ui/components/table";
import { Avatar, AvatarFallback, AvatarImage } from "@shopvendly/ui/components/avatar";
import { Badge } from "@shopvendly/ui/components/badge";
import { cn } from "@shopvendly/ui/lib/utils";
import { format } from "date-fns";
import { Skeleton } from "@shopvendly/ui/components/skeleton";

export interface User {
    id: string;
    name: string;
    email: string;
    image?: string | null;
    emailVerified: boolean;
    createdAt: string;
}

interface UserTableProps {
    users: User[];
    isLoading: boolean;
}

export function UserTable({ users, isLoading }: UserTableProps) {
    if (isLoading) {
        return (
            <Table>
                <TableHeader className="bg-muted/30">
                    <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[80px]"><Skeleton className="h-3 w-12" /></TableHead>
                        <TableHead><Skeleton className="h-3 w-24" /></TableHead>
                        <TableHead><Skeleton className="h-3 w-32" /></TableHead>
                        <TableHead><Skeleton className="h-3 w-16" /></TableHead>
                        <TableHead><Skeleton className="h-3 w-20" /></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {[1, 2, 3, 4, 5].map((i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-20 rounded-full" /></TableCell>
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
                    <TableHead className="w-[80px] text-xs font-medium text-muted-foreground">Avatar</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Full Name</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Email</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Status</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Joined</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {users.map((user) => (
                    <TableRow key={user.id} className="hover:bg-muted/30 transition-colors border-b border-border/50 last:border-0">
                        <TableCell>
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={user.image || ""} alt={user.name} />
                                <AvatarFallback className="text-[10px]">{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                        </TableCell>
                        <TableCell className="font-medium text-foreground">{user.name}</TableCell>
                        <TableCell className="text-muted-foreground">{user.email}</TableCell>
                        <TableCell>
                            <Badge
                                variant="outline"
                                className={cn(
                                    "px-2 py-0.5 rounded-full text-[10px] font-bold border-0 uppercase tracking-wider",
                                    user.emailVerified
                                        ? "bg-emerald-100 text-emerald-800"
                                        : "bg-amber-100 text-amber-800"
                                )}
                            >
                                {user.emailVerified ? "Verified" : "Unverified"}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                            {format(new Date(user.createdAt), "MMM d, yyyy")}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
