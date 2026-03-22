export type ActivityEventType = 
  | "order_placed"
  | "payment_received"
  | "payment_failed"
  | "customer_registered"
  | "low_stock"
  | "system_alert";

export interface ActivityEvent {
  id: string;
  type: ActivityEventType;
  title: string;
  description: string;
  timestamp: string;
  actor?: {
    name: string;
    image?: string;
  };
  metadata?: Record<string, any>;
}

export interface ActivityResponse {
  events: ActivityEvent[];
}
