export type OrderStatus =
    | "pending"
    | "pending_seller_acceptance"
    | "awaiting_payment"
    | "processing"
    | "paid_processing"
    | "ready"
    | "out_for_delivery"
    | "completed"
    | "cancelled"
    | "delivery_exception"
    | "refunded";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface OrderTableRow {
    id: string;
    orderNumber: string;
    customerName: string;
    customerEmail: string;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    paymentMethod: string;
    totalAmount: number;
    currency: string;
    createdAt: string;
    items?: Array<{ productName?: string | null } | null>;
}

export interface OrderAPIResponse {
    id: string;
    orderNumber: string;
    customerName: string;
    customerEmail: string;
    status: string;
    paymentStatus: string;
    paymentMethod: string;
    totalAmount: number;
    currency: string;
    createdAt: string;
    items?: Array<{ productName?: string | null } | null>;
}

export interface OrdersListResponse {
    orders: OrderAPIResponse[];
    total: number;
    page: number;
    limit: number;
}

export interface OrderStatsResponse {
    totalRevenue: number;
    orderCount: number;
    pendingCount: number;
    refundedAmount: number;
    currency: string;
}

export type TransactionRow = {
  id: string;
  customer: string;
  amount: string;
  status: "Completed" | "Failed" | "Pending";
  date: string;
};
