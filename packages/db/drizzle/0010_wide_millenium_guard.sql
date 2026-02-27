CREATE TYPE "public"."tenant_role" AS ENUM('owner', 'admin', 'member');--> statement-breakpoint
CREATE TYPE "public"."tenant_status" AS ENUM('active', 'suspended', 'onboarding');--> statement-breakpoint
CREATE TABLE "platform_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"image_url" text,
	"sort_order" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "platform_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "tenant_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"role" "tenant_role" DEFAULT 'member' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tenant_memberships_unique" UNIQUE("tenant_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "tenants" ALTER COLUMN "status" SET DATA TYPE tenant_status;--> statement-breakpoint
ALTER TABLE "tenants" ALTER COLUMN "status" SET DEFAULT 'onboarding';--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "plan" text DEFAULT 'free';--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "billing_email" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "settings" jsonb;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "tenant_memberships" ADD CONSTRAINT "tenant_memberships_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_memberships" ADD CONSTRAINT "tenant_memberships_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tenant_memberships_tenant_idx" ON "tenant_memberships" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "tenant_memberships_user_idx" ON "tenant_memberships" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tenants_status_idx" ON "tenants" USING btree ("status");