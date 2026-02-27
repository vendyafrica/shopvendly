CREATE TABLE "whatsapp_message_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" text NOT NULL,
	"phone" text NOT NULL,
	"order_id" uuid,
	"category" text,
	"billable" boolean DEFAULT false NOT NULL,
	"pricing" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "whatsapp_message_logs" ADD CONSTRAINT "whatsapp_message_logs_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;