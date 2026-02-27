CREATE TABLE "tiktok_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"store_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"display_name" text,
	"username" text,
	"avatar_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_synced_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tiktok_accounts_store_unique" UNIQUE("store_id")
);
--> statement-breakpoint
ALTER TABLE "tiktok_accounts" ADD CONSTRAINT "tiktok_accounts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tiktok_accounts" ADD CONSTRAINT "tiktok_accounts_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tiktok_accounts" ADD CONSTRAINT "tiktok_accounts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tiktok_accounts_tenant_idx" ON "tiktok_accounts" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "tiktok_accounts_store_idx" ON "tiktok_accounts" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "tiktok_accounts_user_idx" ON "tiktok_accounts" USING btree ("user_id");