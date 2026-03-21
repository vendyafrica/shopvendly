export type NotificationRow = {
  id: string;
  type: "Order" | "System" | "Alert" | "Payment";
  summary: string;
  channel: "In-App";
  status: "New";
  time: string;
};
