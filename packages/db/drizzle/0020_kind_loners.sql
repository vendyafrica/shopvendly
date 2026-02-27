CREATE TABLE "instagram_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"account_id" text NOT NULL,
	"username" text,
	"account_type" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_synced_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "instagram_connections_tenant_account_unique" UNIQUE("tenant_id","account_id")
);
--> statement-breakpoint
CREATE TABLE "instagram_sync_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"connection_id" uuid NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"media_fetched" integer DEFAULT 0 NOT NULL,
	"products_created" integer DEFAULT 0 NOT NULL,
	"products_skipped" integer DEFAULT 0 NOT NULL,
	"errors" jsonb,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "slug" text NOT NULL;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "theme" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "content" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "media_objects" ADD COLUMN "source_metadata" jsonb;--> statement-breakpoint
ALTER TABLE "media_objects" ADD COLUMN "last_synced_at" timestamp;--> statement-breakpoint
ALTER TABLE "instagram_connections" ADD CONSTRAINT "instagram_connections_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instagram_connections" ADD CONSTRAINT "instagram_connections_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instagram_sync_jobs" ADD CONSTRAINT "instagram_sync_jobs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instagram_sync_jobs" ADD CONSTRAINT "instagram_sync_jobs_connection_id_instagram_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."instagram_connections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "instagram_connections_tenant_idx" ON "instagram_connections" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "instagram_connections_user_idx" ON "instagram_connections" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "instagram_sync_jobs_tenant_idx" ON "instagram_sync_jobs" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "instagram_sync_jobs_connection_idx" ON "instagram_sync_jobs" USING btree ("connection_id");--> statement-breakpoint
CREATE INDEX "instagram_sync_jobs_status_idx" ON "instagram_sync_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "instagram_sync_jobs_created_idx" ON "instagram_sync_jobs" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_slug_unique" UNIQUE("slug");