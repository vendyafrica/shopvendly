CREATE TABLE "store_collections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"store_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"image" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "store_collections_store_slug_unique" UNIQUE("store_id","slug"),
	CONSTRAINT "store_collections_store_name_unique" UNIQUE("store_id","name")
);
--> statement-breakpoint
CREATE TABLE "product_collections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"collection_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "product_collections_unique" UNIQUE("collection_id","product_id")
);
--> statement-breakpoint
ALTER TABLE "store_collections" ADD CONSTRAINT "store_collections_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "store_collections" ADD CONSTRAINT "store_collections_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "product_collections" ADD CONSTRAINT "product_collections_collection_id_store_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."store_collections"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "product_collections" ADD CONSTRAINT "product_collections_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "store_collections_store_idx" ON "store_collections" USING btree ("store_id");
--> statement-breakpoint
CREATE INDEX "store_collections_store_sort_idx" ON "store_collections" USING btree ("store_id","sort_order");
--> statement-breakpoint
CREATE INDEX "product_collections_collection_idx" ON "product_collections" USING btree ("collection_id");
--> statement-breakpoint
CREATE INDEX "product_collections_product_idx" ON "product_collections" USING btree ("product_id");
