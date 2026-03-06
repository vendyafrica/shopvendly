import { z } from "zod";
import type { Order, OrderItem } from "@shopvendly/db/schema";

/**
 * Order item input for creating orders
 */
export const orderItemSelectedOptionSchema = z.object({
  name: z.string().min(1).max(64),
  value: z.string().min(1).max(120),
});

export const orderItemInputSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).default(1),
  selectedOptions: z.array(orderItemSelectedOptionSchema).max(8).optional(),
});

export type OrderItemInput = z.infer<typeof orderItemInputSchema>;

/**
 * Create order input (from storefront)
 */
export const createOrderSchema = z.object({
  customerName: z.string().min(1).max(255),
  customerEmail: z.string().email(),
  customerPhone: z.string().optional(),
  paymentMethod: z.enum(["card", "mpesa", "mtn_momo", "mobile_money", "paystack", "cash_on_delivery"]).default("cash_on_delivery"),
  notes: z.string().optional(),
  deliveryAddress: z.string().optional(),
  shippingAddress: z
    .object({
      street: z.string().optional(),
    })
    .optional(),
  items: z.array(orderItemInputSchema).min(1),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

/**
 * Update order status (from admin/seller)
 */
export const updateOrderStatusSchema = z.object({
  status: z
    .enum([
      "pending",
      "pending_seller_acceptance",
      "awaiting_payment",
      "processing",
      "paid_processing",
      "ready",
      "out_for_delivery",
      "completed",
      "cancelled",
      "delivery_exception",
      "refunded",
    ])
    .optional(),
  paymentStatus: z.enum(["pending", "paid", "failed", "refunded"]).optional(),
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

/**
 * Order query filters
 */
export const orderQuerySchema = z.object({
  status: z
    .enum([
      "pending",
      "pending_seller_acceptance",
      "awaiting_payment",
      "processing",
      "paid_processing",
      "ready",
      "out_for_delivery",
      "completed",
      "cancelled",
      "delivery_exception",
      "refunded",
    ])
    .optional(),
  paymentStatus: z.enum(["pending", "paid", "failed", "refunded"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
});

export type OrderFilters = z.infer<typeof orderQuerySchema>;

/**
 * Order with items
 */
export interface OrderWithItems extends Order {
  items: OrderItem[];
}

/**
 * Order stats response
 */
export interface OrderStats {
  totalRevenue: number;
  revenueChange: string;
  orderCount: number;
  countChange: string;
  pendingCount: number;
  pendingChange: string;
  refundedAmount: number;
  refundedChange: string;
  currency: string;
}
