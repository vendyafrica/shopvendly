-- Drop unused columns from customers table
ALTER TABLE "customers" DROP COLUMN IF EXISTS "products_viewed";
ALTER TABLE "customers" DROP COLUMN IF EXISTS "actions_log";

-- Drop unused currency column from order_items (inherited from orders)
ALTER TABLE "order_items" DROP COLUMN IF EXISTS "currency";

-- Drop unused UTM/referrer columns from storefront_events (these exist on storefront_sessions)
ALTER TABLE "storefront_events" DROP COLUMN IF EXISTS "referrer";
ALTER TABLE "storefront_events" DROP COLUMN IF EXISTS "utm_source";
ALTER TABLE "storefront_events" DROP COLUMN IF EXISTS "utm_medium";
ALTER TABLE "storefront_events" DROP COLUMN IF EXISTS "utm_campaign";
