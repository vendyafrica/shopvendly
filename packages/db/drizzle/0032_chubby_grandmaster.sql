CREATE TABLE "whatsapp_message_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"order_id" uuid,
	"direction" text NOT NULL,
	"message_type" text NOT NULL,
	"recipient_phone" text NOT NULL,
	"sender_phone" text,
	"message_body" text,
	"template_name" text,
	"template_language" text,
	"template_components" jsonb,
	"status" text DEFAULT 'queued' NOT NULL,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"max_retries" integer DEFAULT 3 NOT NULL,
	"dedupe_key" text,
	"wa_message_id" text,
	"error_details" text,
	"scheduled_at" timestamp DEFAULT now() NOT NULL,
	"sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "whatsapp_queue_dedupe_key_unique" UNIQUE("dedupe_key")
);
--> statement-breakpoint
ALTER TABLE "whatsapp_message_queue" ADD CONSTRAINT "whatsapp_message_queue_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_message_queue" ADD CONSTRAINT "whatsapp_message_queue_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "whatsapp_queue_status_scheduled_idx" ON "whatsapp_message_queue" USING btree ("status","scheduled_at");--> statement-breakpoint
CREATE INDEX "whatsapp_queue_tenant_idx" ON "whatsapp_message_queue" USING btree ("tenant_id");