"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
    MoreHorizontalIcon,
    ViewIcon,
    Tick02Icon,
    Cancel01Icon,
    ArrowTurnBackwardIcon,
} from "@hugeicons/core-free-icons";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@shopvendly/ui/components/table";
import { Badge } from "@shopvendly/ui/components/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@shopvendly/ui/components/dropdown-menu";
import { cn } from "@shopvendly/ui/lib/utils";
import { type OrderStatus, type PaymentStatus, type OrderTableRow } from "@/modules/admin/models";


interface OrderTableProps {
    orders: OrderTableRow[];
    onViewDetails?: (id: string) => void;
    onUpdateStatus?: (id: string, status: OrderStatus) => void;
    isLoading?: boolean;
}

function formatPrice(amount: number, currency: string): string {
    return new Intl.NumberFormat("en-KE", {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
    }).format(amount);
}

function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });
}

function StatusBadge({ status }: { status: OrderStatus | PaymentStatus }) {
    const styles: Record<string, string> = {
        completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
        paid: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
        processing: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
        paid_processing: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
        pending_seller_acceptance: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
        awaiting_payment: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
        ready: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
        out_for_delivery: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
        pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
        delivery_exception: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
        failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
        cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
        refunded: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    };

    const labels: Record<string, string> = {
        completed: "Completed",
        paid: "Paid",
        processing: "Processing",
        paid_processing: "Paid / Processing",
        pending_seller_acceptance: "Pending seller acceptance",
        awaiting_payment: "Awaiting payment",
        ready: "Ready",
        out_for_delivery: "Out for delivery",
        pending: "Pending",
        delivery_exception: "Delivery exception",
        failed: "Failed",
        cancelled: "Cancelled",
        refunded: "Refunded",
    };

    return (
        <Badge className={cn("border-0 shadow-none font-medium capitalize", styles[status])}>
            {labels[status] || status}
        </Badge>
    );
}

function OrderActions({
    orderId,
    currentStatus,
    onViewDetails,
    onUpdateStatus,
}: {
    orderId: string;
    currentStatus: OrderStatus;
    onViewDetails?: (id: string) => void;
    onUpdateStatus?: (id: string, status: OrderStatus) => void;
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                render={
                    <div className="inline-flex items-center justify-center size-8 rounded-md border border-border/60 bg-card hover:bg-muted/70 cursor-pointer shrink-0 transition-colors">
                        <HugeiconsIcon icon={MoreHorizontalIcon} className="size-4" />
                        <span className="sr-only">Actions</span>
                    </div>
                }
            />
            <DropdownMenuContent align="end" className="min-w-44">
                <DropdownMenuItem onClick={() => onViewDetails?.(orderId)} className="p-2 cursor-pointer">
                    <HugeiconsIcon icon={ViewIcon} className="size-4" />
                    View Details
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {(currentStatus === "pending" || currentStatus === "pending_seller_acceptance") && (
                    <DropdownMenuItem
                        onClick={() => onUpdateStatus?.(orderId, "awaiting_payment")}
                        className="p-2 cursor-pointer"
                    >
                        <HugeiconsIcon icon={Tick02Icon} className="size-4" />
                        Mark Awaiting Payment
                    </DropdownMenuItem>
                )}
                {(currentStatus === "processing" || currentStatus === "paid_processing") && (
                    <DropdownMenuItem
                        onClick={() => onUpdateStatus?.(orderId, "ready")}
                        className="p-2 cursor-pointer"
                    >
                        <HugeiconsIcon icon={Tick02Icon} className="size-4" />
                        Mark Ready
                    </DropdownMenuItem>
                )}
                {currentStatus === "ready" && (
                    <DropdownMenuItem
                        onClick={() => onUpdateStatus?.(orderId, "out_for_delivery")}
                        className="p-2 cursor-pointer"
                    >
                        <HugeiconsIcon icon={Tick02Icon} className="size-4" />
                        Mark Out for Delivery
                    </DropdownMenuItem>
                )}
                {currentStatus === "out_for_delivery" && (
                    <DropdownMenuItem
                        onClick={() => onUpdateStatus?.(orderId, "completed")}
                        className="p-2 cursor-pointer"
                    >
                        <HugeiconsIcon icon={Tick02Icon} className="size-4" />
                        Mark Completed
                    </DropdownMenuItem>
                )}
                {(currentStatus === "pending"
                    || currentStatus === "pending_seller_acceptance"
                    || currentStatus === "awaiting_payment"
                    || currentStatus === "processing"
                    || currentStatus === "paid_processing"
                    || currentStatus === "ready") && (
                    <>
                        <DropdownMenuItem
                            onClick={() => onUpdateStatus?.(orderId, "cancelled")}
                            className="p-2 cursor-pointer text-destructive"
                        >
                            <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
                            Cancel Order
                        </DropdownMenuItem>
                    </>
                )}
                {currentStatus === "completed" && (
                    <DropdownMenuItem
                        onClick={() => onUpdateStatus?.(orderId, "refunded")}
                        className="p-2 cursor-pointer"
                    >
                        <HugeiconsIcon icon={ArrowTurnBackwardIcon} className="size-4" />
                        Refund Order
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function TableSkeleton() {
    return (
        <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 rounded-lg border border-dashed border-border/60 p-3 bg-muted/30">
                    <div className="h-4 bg-muted rounded w-20 animate-pulse shrink-0" />
                    <div className="h-6 bg-muted rounded w-20 animate-pulse shrink-0" />
                    <div className="flex-1 space-y-1">
                        <div className="h-4 bg-muted rounded w-32 animate-pulse" />
                        <div className="h-3 bg-muted rounded w-40 animate-pulse" />
                    </div>
                    <div className="h-4 bg-muted rounded w-20 animate-pulse shrink-0" />
                    <div className="h-4 bg-muted rounded w-24 animate-pulse shrink-0" />
                    <div className="h-4 bg-muted rounded w-20 animate-pulse shrink-0" />
                    <div className="size-8 bg-muted rounded animate-pulse shrink-0" />
                </div>
            ))}
        </div>
    );
}

export function OrderTable({
    orders,
    onViewDetails,
    onUpdateStatus,
    isLoading = false,
}: OrderTableProps) {
    if (isLoading) {
        return <TableSkeleton />;
    }

    if (orders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/70 bg-muted/40 py-10 text-center">
                <p className="text-base font-medium text-foreground">No orders yet</p>
                <p className="text-muted-foreground text-sm mt-1">
                    Orders will appear here when customers make purchases.
                </p>
            </div>
        );
    }

    return (
        <Table className="w-full text-sm">
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[100px]">Invoice</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {orders.map((order) => (
                    <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.orderNumber}</TableCell>
                        <TableCell>
                            <StatusBadge status={order.paymentStatus} />
                        </TableCell>
                        <TableCell>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium">{order.customerName}</span>
                                <span className="text-xs text-muted-foreground">{order.customerEmail}</span>
                            </div>
                        </TableCell>
                        <TableCell className="capitalize">{order.paymentMethod.replace(/_/g, " ")}</TableCell>
                        <TableCell>{formatDate(order.createdAt)}</TableCell>
                        <TableCell className="text-right">{formatPrice(order.totalAmount, order.currency)}</TableCell>
                        <TableCell>
                            <OrderActions
                                orderId={order.id}
                                currentStatus={order.status}
                                onViewDetails={onViewDetails}
                                onUpdateStatus={onUpdateStatus}
                            />
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
