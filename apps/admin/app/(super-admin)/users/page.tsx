"use client";

import * as React from "react";
import { UserTable, type User } from "./components/user-table";
import { Card, CardContent } from "@shopvendly/ui/components/card";

export default function UsersPage() {
    const [users, setUsers] = React.useState<User[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch("/api/users");
                const data = await res.json();

                if (Array.isArray(data)) {
                    setUsers(data);
                }
            } catch (error) {
                console.error("Failed to fetch users:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    // Calculate stats
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.emailVerified).length;
    const pendingUsers = users.filter(u => !u.emailVerified).length;

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
            {/* Header */}
            <div>
                <p className="text-sm text-muted-foreground">
                    Manage all platform users and their accounts
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card size="sm" className="bg-muted/20 border-border/40 shadow-none">
                    <CardContent className="pt-4 flex flex-col gap-1.5">
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-tight">Total Users</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-xl font-bold tracking-tight text-foreground">{isLoading ? "—" : totalUsers.toString()}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground/60">All registered users</span>
                    </CardContent>
                </Card>

                <Card size="sm" className="bg-muted/20 border-border/40 shadow-none">
                    <CardContent className="pt-4 flex flex-col gap-1.5">
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-tight">Active Users</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-xl font-bold tracking-tight text-foreground">{isLoading ? "—" : activeUsers.toString()}</span>
                            {!isLoading && <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">Verified</span>}
                        </div>
                        <span className="text-[10px] text-muted-foreground/60">Email verified</span>
                    </CardContent>
                </Card>

                <Card size="sm" className="bg-muted/20 border-border/40 shadow-none">
                    <CardContent className="pt-4 flex flex-col gap-1.5">
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-tight">Pending</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-xl font-bold tracking-tight text-foreground">{isLoading ? "—" : pendingUsers.toString()}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground/60">Awaiting verification</span>
                    </CardContent>
                </Card>

                <Card size="sm" className="bg-muted/20 border-border/40 shadow-none">
                    <CardContent className="pt-4 flex flex-col gap-1.5">
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-tight">Verification Rate</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-xl font-bold tracking-tight text-foreground">
                                {isLoading ? "—" : totalUsers > 0 ? `${Math.round((activeUsers / totalUsers) * 100)}%` : "0%"}
                            </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground/60">Email completion</span>
                    </CardContent>
                </Card>
            </div>

            {/* Users Table */}
            <div className="rounded-md border border-border/70 bg-card shadow-sm">
                <UserTable users={users} isLoading={isLoading} />
            </div>
        </div>
    );
}
