"use client";

import * as React from "react";
import { StoreTable, type Store } from "./components/store-table";
import { StoreStats } from "./components/store-stats";

export default function StoresPage() {
    const [stores, setStores] = React.useState<Store[]>([]);
    const [stats, setStats] = React.useState({
        totalStores: 0,
        totalRevenue: 0,
        totalSales: 0,
    });
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const [storesRes, adminRes] = await Promise.all([
                    fetch("/api/stores"),
                    fetch("/api/admin")
                ]);

                const storesData = await storesRes.json();
                const adminData = await adminRes.json();

                if (Array.isArray(storesData)) {
                    setStores(storesData);
                }

                if (adminData.stores && adminData.marketplace) {
                    setStats({
                        totalStores: adminData.stores.total,
                        totalRevenue: adminData.marketplace.gmv,
                        totalSales: adminData.marketplace.totalOrders
                    });
                }
            } catch (error) {
                console.error("Failed to fetch stores:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Stores</h1>
                <p className="text-sm text-muted-foreground">
                    Overview of all stores and their performance
                </p>
            </div>

            {/* Stats */}
            <StoreStats stats={stats} isLoading={isLoading} />

            {/* Stores Table */}
            <div className="rounded-md border border-border/70 bg-card shadow-sm">
                <StoreTable stores={stores} isLoading={isLoading} />
            </div>
        </div>
    );
}
