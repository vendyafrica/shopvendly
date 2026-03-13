CREATE TABLE "collecto_payment_collections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"store_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"provider" text DEFAULT 'collecto' NOT NULL,
	"provider_reference" text,
	"provider_transaction_id" text,
	"payer_phone" text,
	"payer_name" text,
	"amount" integer DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'UGX' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"provider_message" text,
	"raw_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"initiated_at" timestamp,
	"confirmed_at" timestamp,
	"failed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collecto_settlement_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"store_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"settlement_batch_order_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"settlement_amount" integer DEFAULT 0 NOT NULL,
	"settlement_status" text DEFAULT 'pending' NOT NULL,
	"wallet_transfer_reference" text,
	"wallet_transfer_transaction_id" text,
	"wallet_transfer_amount" integer,
	"wallet_transfer_status" text,
	"wallet_transfer_message" text,
	"payout_reference" text,
	"payout_transaction_id" text,
	"payout_gateway" text,
	"payout_amount" integer,
	"payout_recipient_phone" text,
	"payout_recipient_name" text,
	"payout_status" text,
	"payout_message" text,
	"raw_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"initiated_at" timestamp,
	"completed_at" timestamp,
	"failed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "collecto_payment_collections" ADD CONSTRAINT "collecto_payment_collections_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collecto_payment_collections" ADD CONSTRAINT "collecto_payment_collections_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collecto_payment_collections" ADD CONSTRAINT "collecto_payment_collections_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collecto_settlement_attempts" ADD CONSTRAINT "collecto_settlement_attempts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collecto_settlement_attempts" ADD CONSTRAINT "collecto_settlement_attempts_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collecto_settlement_attempts" ADD CONSTRAINT "collecto_settlement_attempts_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "collecto_payment_collections_order_idx" ON "collecto_payment_collections" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "collecto_payment_collections_tenant_store_idx" ON "collecto_payment_collections" USING btree ("tenant_id","store_id");--> statement-breakpoint
CREATE INDEX "collecto_payment_collections_status_idx" ON "collecto_payment_collections" USING btree ("status");--> statement-breakpoint
CREATE INDEX "collecto_payment_collections_created_at_idx" ON "collecto_payment_collections" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "collecto_settlement_attempts_order_idx" ON "collecto_settlement_attempts" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "collecto_settlement_attempts_tenant_store_idx" ON "collecto_settlement_attempts" USING btree ("tenant_id","store_id");--> statement-breakpoint
CREATE INDEX "collecto_settlement_attempts_status_idx" ON "collecto_settlement_attempts" USING btree ("settlement_status");--> statement-breakpoint
CREATE INDEX "collecto_settlement_attempts_created_at_idx" ON "collecto_settlement_attempts" USING btree ("created_at");