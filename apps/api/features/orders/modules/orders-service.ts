export {
  orderService,
  orderItemInputSchema,
  createOrderSchema,
  updateOrderStatusSchema,
} from "../../orders/services/order-service";

export type {
  OrderItemInput,
  CreateOrderInput,
  UpdateOrderStatusInput,
  OrderWithItems,
} from "../../orders/services/order-service";
