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
import { format } from "date-fns";

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
        return <div className="p-8 text-center text-muted-foreground">Loading users...</div>;
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[80px]">Avatar</TableHead>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {users.map((user) => (
                    <TableRow key={user.id}>
                        <TableCell>
                            <Avatar className="h-9 w-9">
                                <AvatarImage src={user.image || ""} alt={user.name} />
                                <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                        </TableCell>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                            <Badge variant={user.emailVerified ? "outline" : "secondary"}>
                                {user.emailVerified ? "Verified" : "Unverified"}
                            </Badge>
                        </TableCell>
                        <TableCell>{format(new Date(user.createdAt), "MMM d, yyyy")}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
