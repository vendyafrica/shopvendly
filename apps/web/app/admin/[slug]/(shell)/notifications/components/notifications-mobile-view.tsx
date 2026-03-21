"use client";

import Image from "next/image";
import { Avatar, AvatarFallback } from "@shopvendly/ui/components/avatar";
import { type TenantBootstrap } from "@/modules/admin/context";
import { SegmentedStatsCard } from "@/modules/admin/components/segmented-stats-card";
import { type NotificationRow } from "@/modules/admin/models";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    Notification02Icon,
    Settings02Icon,
    ShoppingCart01Icon,
    CheckmarkBadge01Icon,
    InformationCircleIcon,
    Alert01Icon
} from "@hugeicons/core-free-icons";

interface NotificationsMobileViewProps {
    bootstrap: TenantBootstrap | null;
    notifications: NotificationRow[];
    statSegments: {
        label: string;
        value: string | number;
        changeLabel: string;
        changeTone: "neutral" | "positive" | "negative";
    }[];
}

const TYPE_ICONS = {
    Order: ShoppingCart01Icon,
    Payment: ShoppingCart01Icon,
    System: InformationCircleIcon,
    Alert: Alert01Icon,
} as const;

const TYPE_COLORS = {
    Order: "text-blue-500 bg-blue-50 border-blue-200",
    Payment: "text-blue-500 bg-blue-50 border-blue-200",
    System: "text-emerald-500 bg-emerald-50 border-emerald-200",
    Alert: "text-amber-500 bg-amber-50 border-amber-200",
} as const;

export function NotificationsMobileView({
    bootstrap,
    notifications,
    statSegments,
}: NotificationsMobileViewProps) {
    const storeInitials = bootstrap?.storeName?.substring(0, 2).toUpperCase() || "SV";

    return (
        <div className="flex flex-col min-h-screen bg-background pb-20 fade-in-0 duration-500 animate-in">
            {/* Header section */}
            <div className="px-5 pt-8 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Avatar className="size-12 border border-border/50">
                        {bootstrap?.storeLogoUrl ? (
                            <Image
                                src={bootstrap.storeLogoUrl}
                                alt={bootstrap.storeName || "Store logo"}
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
                                {storeInitials}
                            </AvatarFallback>
                        )}
                    </Avatar>
                    <div className="flex flex-col">
                        <h1 className="font-bold text-lg leading-tight flex items-center gap-1.5">
                            Notifications
                            <HugeiconsIcon icon={CheckmarkBadge01Icon} className="size-4 text-blue-500" />
                        </h1>
                        <p className="text-xs text-muted-foreground font-medium">#{bootstrap?.storeSlug}</p>
                    </div>
                </div>
            </div>

            {/* Bio / Description */}
            <div className="px-5 mb-5 space-y-1.5">
                <p className="text-sm">
                    Recent activity from orders and system events.
                </p>
            </div>

            {/* Stats section */}
            <div className="px-5 mb-6">
                <SegmentedStatsCard segments={statSegments} />
            </div>

            <div className="w-full h-px bg-border/40" />

            {/* Navigation Tabs */}
            <div className="flex w-full border-b border-border/40">
                <div className="flex-1 py-3.5 flex justify-center items-center border-b-[1.5px] border-foreground">
                    <HugeiconsIcon icon={Notification02Icon} className="size-[22px] text-foreground" />
                </div>
                <div className="flex-1 py-3.5 flex justify-center items-center text-muted-foreground opacity-50">
                    <HugeiconsIcon icon={Settings02Icon} className="size-[22px]" />
                </div>
            </div>

            {/* Notifications Feed */}
            <div className="flex flex-col px-4 pt-4 gap-4">
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-50">
                        <div className="size-16 rounded-full border-2 border-dashed border-border flex items-center justify-center mb-4">
                            <HugeiconsIcon icon={Notification02Icon} className="size-8 text-muted-foreground" />
                        </div>
                        <p className="font-semibold text-foreground">All caught up!</p>
                    </div>
                ) : (
                    notifications.map((n: NotificationRow, i) => {
                        const iconKey = n.type as keyof typeof TYPE_ICONS;
                        const Icon = TYPE_ICONS[iconKey] || InformationCircleIcon;
                        const colorKey = n.type as keyof typeof TYPE_COLORS;
                        const colors = TYPE_COLORS[colorKey] || TYPE_COLORS.System;
                        const isNew = n.status === "New";

                        return (
                            <div
                                key={n.id || i}
                                className={`w-full flex items-start gap-4 p-4 rounded-xl transition-colors ${isNew ? "bg-primary/5 border border-primary/20" : "bg-muted/10 border border-border/20"
                                    }`}
                            >
                                <div className={`shrink-0 size-10 rounded-full flex items-center justify-center border ${colors}`}>
                                    <HugeiconsIcon icon={Icon} className="size-5" />
                                </div>
                                <div className="flex flex-col flex-1 gap-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="font-bold text-sm truncate flex items-center gap-1.5">
                                            {n.type}
                                            {isNew && (
                                                <span className="shrink-0 size-1.5 rounded-full bg-primary" />
                                            )}
                                        </span>
                                        <span className="text-xs text-muted-foreground whitespace-nowrap">{n.time}</span>
                                    </div>
                                    <p className={`text-sm leading-snug ${isNew ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                                        {n.summary}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
