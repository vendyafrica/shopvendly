CREATE TABLE "product_ratings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"rating" smallint NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "product_ratings_product_user_unique" UNIQUE("product_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "product_ratings" ADD CONSTRAINT "product_ratings_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_ratings" ADD CONSTRAINT "product_ratings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "product_ratings_product_idx" ON "product_ratings" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_ratings_user_idx" ON "product_ratings" USING btree ("user_id");