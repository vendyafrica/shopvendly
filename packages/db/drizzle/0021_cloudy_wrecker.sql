CREATE TABLE "platform_customers" (
	"user_id" text,
	"lifetime_orders" integer DEFAULT 0,
	"lifetime_spend" numeric(12, 2) DEFAULT '0',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_roles" (
	"user_id" text,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "store_memberships" RENAME TO "store_customers";--> statement-breakpoint
ALTER TABLE "tenants" DROP CONSTRAINT "tenants_slug_unique";--> statement-breakpoint
ALTER TABLE "store_customers" DROP CONSTRAINT "store_memberships_unique";--> statement-breakpoint
ALTER TABLE "store_customers" DROP CONSTRAINT "store_memberships_tenant_id_tenants_id_fk";
--> statement-breakpoint
ALTER TABLE "store_customers" DROP CONSTRAINT "store_memberships_store_id_stores_id_fk";
--> statement-breakpoint
ALTER TABLE "store_customers" DROP CONSTRAINT "store_memberships_user_id_user_id_fk";
--> statement-breakpoint
DROP INDEX "store_memberships_tenant_idx";--> statement-breakpoint
DROP INDEX "store_memberships_store_idx";--> statement-breakpoint
DROP INDEX "store_memberships_user_idx";--> statement-breakpoint
ALTER TABLE "store_customers" ADD COLUMN "total_orders" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "store_customers" ADD COLUMN "total_spend" numeric(12, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "store_customers" ADD COLUMN "last_order_at" timestamp;--> statement-breakpoint
ALTER TABLE "platform_customers" ADD CONSTRAINT "platform_customers_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_roles" ADD CONSTRAINT "platform_roles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "platform_customers_userId_idx" ON "platform_customers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "platform_roles_name_idx" ON "platform_roles" USING btree ("name");--> statement-breakpoint
ALTER TABLE "store_customers" ADD CONSTRAINT "store_customers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_customers" ADD CONSTRAINT "store_customers_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_customers" ADD CONSTRAINT "store_customers_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "store_customers_tenant_idx" ON "store_customers" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "store_customers_store_idx" ON "store_customers" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "store_customers_user_idx" ON "store_customers" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "tenants" DROP COLUMN "slug";--> statement-breakpoint
ALTER TABLE "store_customers" DROP COLUMN "role";--> statement-breakpoint
ALTER TABLE "store_customers" ADD CONSTRAINT "store_customers_unique" UNIQUE("store_id","user_id");