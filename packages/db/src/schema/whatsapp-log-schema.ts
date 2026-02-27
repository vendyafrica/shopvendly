import { pgTable, uuid, text, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { orders } from "./order-schema";

export const whatsappMessageLogs = pgTable("whatsapp_message_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  messageId: text("message_id").notNull(),
  phone: text("phone").notNull(),
  orderId: uuid("order_id").references(() => orders.id),
  category: text("category"),
  billable: boolean("billable").default(false).notNull(),
  pricing: jsonb("pricing"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
