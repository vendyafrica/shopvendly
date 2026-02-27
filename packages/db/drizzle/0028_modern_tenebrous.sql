CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"store_id" uuid NOT NULL,
	"order_id" uuid,
	"provider" text NOT NULL,
	"provider_reference" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"amount" integer DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'KES' NOT NULL,
	"fees" integer,
	"net_amount" integer,
	"phone_number" text,
	"customer_email" text,
	"raw" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "storefront_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"store_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"user_id" text,
	"session_id" text NOT NULL,
	"order_id" uuid,
	"product_id" uuid,
	"quantity" integer,
	"amount" integer,
	"currency" text,
	"referrer" text,
	"utm_source" text,
	"utm_medium" text,
	"utm_campaign" text,
	"user_agent" text,
	"ip_hash" text,
	"meta" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "storefront_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"store_id" uuid NOT NULL,
	"session_id" text NOT NULL,
	"user_id" text,
	"first_seen_at" timestamp DEFAULT now() NOT NULL,
	"last_seen_at" timestamp DEFAULT now() NOT NULL,
	"visit_count" integer DEFAULT 1 NOT NULL,
	"is_returning" boolean DEFAULT false NOT NULL,
	"referrer" text,
	"utm_source" text,
	"utm_medium" text,
	"utm_campaign" text,
	"device_type" text,
	"country" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "storefront_sessions_store_session_unique" UNIQUE("store_id","session_id")
);
--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storefront_events" ADD CONSTRAINT "storefront_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storefront_events" ADD CONSTRAINT "storefront_events_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storefront_events" ADD CONSTRAINT "storefront_events_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storefront_events" ADD CONSTRAINT "storefront_events_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storefront_events" ADD CONSTRAINT "storefront_events_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storefront_sessions" ADD CONSTRAINT "storefront_sessions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storefront_sessions" ADD CONSTRAINT "storefront_sessions_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storefront_sessions" ADD CONSTRAINT "storefront_sessions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "payments_tenant_store_idx" ON "payments" USING btree ("tenant_id","store_id");--> statement-breakpoint
CREATE INDEX "payments_order_idx" ON "payments" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "payments_status_idx" ON "payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payments_created_idx" ON "payments" USING btree ("store_id","created_at");--> statement-breakpoint
CREATE INDEX "payments_provider_ref_idx" ON "payments" USING btree ("provider_reference");--> statement-breakpoint
CREATE INDEX "storefront_events_tenant_store_idx" ON "storefront_events" USING btree ("tenant_id","store_id");--> statement-breakpoint
CREATE INDEX "storefront_events_type_idx" ON "storefront_events" USING btree ("store_id","event_type");--> statement-breakpoint
CREATE INDEX "storefront_events_created_idx" ON "storefront_events" USING btree ("store_id","created_at");--> statement-breakpoint
CREATE INDEX "storefront_events_product_idx" ON "storefront_events" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "storefront_events_session_idx" ON "storefront_events" USING btree ("store_id","session_id");--> statement-breakpoint
CREATE INDEX "storefront_sessions_tenant_store_idx" ON "storefront_sessions" USING btree ("tenant_id","store_id");--> statement-breakpoint
CREATE INDEX "storefront_sessions_last_seen_idx" ON "storefront_sessions" USING btree ("store_id","last_seen_at");--> statement-breakpoint
CREATE INDEX "storefront_sessions_first_seen_idx" ON "storefront_sessions" USING btree ("store_id","first_seen_at");