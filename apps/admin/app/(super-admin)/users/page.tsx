"use client";

import * as React from "react";
import { UserTable, type User } from "./components/user-table";
import { SegmentedStatsCard } from "@/features/super-admin/components/segmented-stats-card";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function UsersPage() {
    const [users, setUsers] = React.useState<User[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/admin/users`);
                const data = await res.json();

                if (data.success) {
                    setUsers(data.data);
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
                <h1 className="text-2xl font-bold tracking-tight">Users</h1>
                <p className="text-sm text-muted-foreground">
                    Manage all platform users and their accounts
                </p>
            </div>

            {/* Stats */}
            <SegmentedStatsCard
                segments={[
                    {
                        label: "Total Users",
                        value: isLoading ? "—" : totalUsers.toString(),
                        changeLabel: "All registered users",
                        changeTone: "neutral",
                    },
                    {
                        label: "Active Users",
                        value: isLoading ? "—" : activeUsers.toString(),
                        changeLabel: "Email verified",
                        changeTone: "positive",
                    },
                    {
                        label: "Pending",
                        value: isLoading ? "—" : pendingUsers.toString(),
                        changeLabel: "Awaiting verification",
                        changeTone: "neutral",
                    },
                    {
                        label: "Verification Rate",
                        value: isLoading ? "—" : totalUsers > 0 ? `${Math.round((activeUsers / totalUsers) * 100)}%` : "0%",
                        changeLabel: "Completion rate",
                        changeTone: totalUsers > 0 && (activeUsers / totalUsers) > 0.8 ? "positive" : "neutral",
                    },
                ]}
            />

            {/* Users Table */}
            <div className="rounded-md border border-border/70 bg-card shadow-sm">
                <UserTable users={users} isLoading={isLoading} />
            </div>
        </div>
    );
}
