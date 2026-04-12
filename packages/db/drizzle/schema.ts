import { pgTable, index, foreignKey, unique, text, timestamp, uuid, jsonb, boolean, integer, smallint, numeric, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const onboardingStep = pgEnum("onboarding_step", ['signup', 'personal', 'store', 'business', 'complete'])


export const session = pgTable("session", {
	id: text().primaryKey().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	token: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id").notNull(),
}, (table) => [
	index("session_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "session_user_id_user_id_fk"
		}).onDelete("cascade"),
	unique("session_token_unique").on(table.token),
]);

export const tenants = pgTable("tenants", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	fullName: text("full_name").notNull(),
	slug: text().notNull(),
	phoneNumber: text("phone_number"),
	status: text().default('onboarding').notNull(),
	plan: text().default('free'),
	billingEmail: text("billing_email"),
	onboardingStep: onboardingStep("onboarding_step").default('signup').notNull(),
	onboardingData: jsonb("onboarding_data").default({}),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
}, (table) => [
	index("tenants_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	unique("tenants_slug_unique").on(table.slug),
]);

export const tenantMemberships = pgTable("tenant_memberships", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	userId: text("user_id").notNull(),
	role: text().default('owner').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("tenant_memberships_tenant_idx").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	index("tenant_memberships_user_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "tenant_memberships_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "tenant_memberships_user_id_user_id_fk"
		}).onDelete("cascade"),
	unique("tenant_memberships_unique").on(table.tenantId, table.userId),
]);

export const verification = pgTable("verification", {
	id: text().primaryKey().notNull(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("verification_identifier_idx").using("btree", table.identifier.asc().nullsLast().op("text_ops")),
]);

export const stores = pgTable("stores", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	name: text().notNull(),
	slug: text().notNull(),
	description: text(),
	storePolicy: text("store_policy"),
	logoUrl: text("logo_url"),
	categories: text().array().default([""]),
	status: boolean().default(false).notNull(),
	defaultCurrency: text("default_currency").default('UGX').notNull(),
	storeContactPhone: text("store_contact_phone"),
	storeContactEmail: text("store_contact_email"),
	storeAddress: text("store_address"),
	deliveryProviderPhone: text("delivery_provider_phone"),
	collectoPassTransactionFeeToCustomer: boolean("collecto_pass_transaction_fee_to_customer").default(false).notNull(),
	collectoPayoutMode: text("collecto_payout_mode").default('automatic_per_order').notNull(),
	heroMedia: text("hero_media").array().default([""]),
	claimedByEmail: text("claimed_by_email"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
}, (table) => [
	index("stores_slug_idx").using("btree", table.slug.asc().nullsLast().op("text_ops")),
	index("stores_tenant_idx").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "stores_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
	unique("stores_tenant_slug_unique").on(table.tenantId, table.slug),
]);

export const productCategories = pgTable("product_categories", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	productId: uuid("product_id").notNull(),
	categoryId: uuid("category_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("product_categories_category_idx").using("btree", table.categoryId.asc().nullsLast().op("uuid_ops")),
	index("product_categories_product_idx").using("btree", table.productId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "product_categories_product_id_products_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [categories.id],
			name: "product_categories_category_id_categories_id_fk"
		}).onDelete("cascade"),
	unique("product_categories_unique").on(table.productId, table.categoryId),
]);

export const productCollections = pgTable("product_collections", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	collectionId: uuid("collection_id").notNull(),
	productId: uuid("product_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("product_collections_collection_idx").using("btree", table.collectionId.asc().nullsLast().op("uuid_ops")),
	index("product_collections_product_idx").using("btree", table.productId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.collectionId],
			foreignColumns: [storeCollections.id],
			name: "product_collections_collection_id_store_collections_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "product_collections_product_id_products_id_fk"
		}).onDelete("cascade"),
	unique("product_collections_unique").on(table.collectionId, table.productId),
]);

export const user = pgTable("user", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	emailVerified: boolean("email_verified").default(false).notNull(),
	image: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("user_email_unique").on(table.email),
]);

export const productMedia = pgTable("product_media", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	productId: uuid("product_id").notNull(),
	mediaId: uuid("media_id").notNull(),
	sortOrder: integer("sort_order").default(0).notNull(),
	isFeatured: boolean("is_featured").default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("product_media_media_idx").using("btree", table.mediaId.asc().nullsLast().op("uuid_ops")),
	index("product_media_product_idx").using("btree", table.productId.asc().nullsLast().op("uuid_ops")),
	index("product_media_sort_idx").using("btree", table.productId.asc().nullsLast().op("int4_ops"), table.sortOrder.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "product_media_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "product_media_product_id_products_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.mediaId],
			foreignColumns: [mediaObjects.id],
			name: "product_media_media_id_media_objects_id_fk"
		}).onDelete("cascade"),
]);

export const productRatings = pgTable("product_ratings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	productId: uuid("product_id").notNull(),
	userId: text("user_id").notNull(),
	rating: smallint().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("product_ratings_product_idx").using("btree", table.productId.asc().nullsLast().op("uuid_ops")),
	index("product_ratings_user_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "product_ratings_product_id_products_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "product_ratings_user_id_user_id_fk"
		}).onDelete("cascade"),
	unique("product_ratings_product_user_unique").on(table.productId, table.userId),
]);

export const instagramAccounts = pgTable("instagram_accounts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	userId: text("user_id").notNull(),
	accountId: text("account_id").notNull(),
	username: text(),
	accountType: text("account_type"),
	profilePictureUrl: text("profile_picture_url"),
	isActive: boolean("is_active").default(true).notNull(),
	lastSyncedAt: timestamp("last_synced_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("instagram_accounts_tenant_idx").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	index("instagram_accounts_user_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "instagram_accounts_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "instagram_accounts_user_id_user_id_fk"
		}).onDelete("cascade"),
	unique("instagram_accounts_tenant_account_unique").on(table.tenantId, table.accountId),
]);

export const instagramMediaJobs = pgTable("instagram_media_jobs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	accountId: uuid("account_id").notNull(),
	status: text().default('pending').notNull(),
	mediaFetched: integer("media_fetched").default(0).notNull(),
	productsCreated: integer("products_created").default(0).notNull(),
	productsSkipped: integer("products_skipped").default(0).notNull(),
	errors: jsonb(),
	startedAt: timestamp("started_at", { mode: 'string' }),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("instagram_media_jobs_account_idx").using("btree", table.accountId.asc().nullsLast().op("uuid_ops")),
	index("instagram_media_jobs_created_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("instagram_media_jobs_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("instagram_media_jobs_tenant_idx").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "instagram_media_jobs_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.accountId],
			foreignColumns: [instagramAccounts.id],
			name: "instagram_media_jobs_account_id_instagram_accounts_id_fk"
		}).onDelete("cascade"),
]);

export const customers = pgTable("customers", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	storeId: uuid("store_id").notNull(),
	userId: text("user_id"),
	name: text(),
	email: text().notNull(),
	phone: text(),
	totalOrders: integer("total_orders").default(0).notNull(),
	totalSpend: numeric("total_spend", { precision: 12, scale:  2 }).default('0').notNull(),
	lastOrderAt: timestamp("last_order_at", { mode: 'string' }),
	productsViewed: jsonb("products_viewed").default([]),
	actionsLog: jsonb("actions_log").default([]),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("customers_email_idx").using("btree", table.email.asc().nullsLast().op("text_ops")),
	index("customers_store_idx").using("btree", table.storeId.asc().nullsLast().op("uuid_ops")),
	index("customers_tenant_idx").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	index("customers_user_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "customers_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.storeId],
			foreignColumns: [stores.id],
			name: "customers_store_id_stores_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "customers_user_id_user_id_fk"
		}).onDelete("set null"),
]);

export const orderItems = pgTable("order_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	orderId: uuid("order_id").notNull(),
	productId: uuid("product_id"),
	productName: text("product_name").notNull(),
	productImage: text("product_image"),
	selectedOptions: jsonb("selected_options").default([]).notNull(),
	quantity: integer().default(1).notNull(),
	unitPrice: integer("unit_price").notNull(),
	totalPrice: integer("total_price").notNull(),
	currency: text().default('UGX').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("order_items_order_idx").using("btree", table.orderId.asc().nullsLast().op("uuid_ops")),
	index("order_items_product_idx").using("btree", table.productId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "order_items_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "order_items_order_id_orders_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "order_items_product_id_products_id_fk"
		}).onDelete("set null"),
]);

export const superAdmins = pgTable("super_admins", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	role: text().default('super_admin').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("super_admins_user_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "super_admins_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const orders = pgTable("orders", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	storeId: uuid("store_id").notNull(),
	orderNumber: text("order_number").notNull(),
	customerName: text("customer_name").notNull(),
	customerEmail: text("customer_email"),
	customerPhone: text("customer_phone"),
	status: text().default('pending_seller_acceptance').notNull(),
	paymentMethod: text("payment_method").default('cash_on_delivery').notNull(),
	paymentStatus: text("payment_status").default('pending').notNull(),
	subtotal: integer().default(0).notNull(),
	totalAmount: integer("total_amount").default(0).notNull(),
	currency: text().default('UGX').notNull(),
	notes: text(),
	deliveryAddress: text("delivery_address"),
	collectoMeta: jsonb("collecto_meta").default({}).notNull(),
	deliveryProvider: text("delivery_provider"),
	deliveryProviderDispatchId: text("delivery_provider_dispatch_id"),
	deliveryStatus: text("delivery_status"),
	deliveryAssignedAt: timestamp("delivery_assigned_at", { mode: 'string' }),
	deliveryCompletedAt: timestamp("delivery_completed_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
}, (table) => [
	index("orders_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("orders_delivery_status_idx").using("btree", table.deliveryStatus.asc().nullsLast().op("text_ops")),
	index("orders_payment_status_idx").using("btree", table.paymentStatus.asc().nullsLast().op("text_ops")),
	index("orders_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("orders_tenant_created_idx").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops"), table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("orders_tenant_status_created_idx").using("btree", table.tenantId.asc().nullsLast().op("timestamp_ops"), table.status.asc().nullsLast().op("text_ops"), table.createdAt.asc().nullsLast().op("uuid_ops")),
	index("orders_tenant_store_idx").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops"), table.storeId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "orders_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.storeId],
			foreignColumns: [stores.id],
			name: "orders_store_id_stores_id_fk"
		}).onDelete("cascade"),
	unique("orders_store_number_unique").on(table.storeId, table.orderNumber),
]);

export const collectoPaymentCollections = pgTable("collecto_payment_collections", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	storeId: uuid("store_id").notNull(),
	orderId: uuid("order_id").notNull(),
	provider: text().default('collecto').notNull(),
	providerReference: text("provider_reference"),
	providerTransactionId: text("provider_transaction_id"),
	payerPhone: text("payer_phone"),
	payerName: text("payer_name"),
	amount: integer().default(0).notNull(),
	currency: text().default('UGX').notNull(),
	status: text().default('pending').notNull(),
	providerMessage: text("provider_message"),
	rawMetadata: jsonb("raw_metadata").default({}).notNull(),
	initiatedAt: timestamp("initiated_at", { mode: 'string' }),
	confirmedAt: timestamp("confirmed_at", { mode: 'string' }),
	failedAt: timestamp("failed_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("collecto_payment_collections_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("collecto_payment_collections_order_idx").using("btree", table.orderId.asc().nullsLast().op("uuid_ops")),
	index("collecto_payment_collections_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("collecto_payment_collections_tenant_store_idx").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops"), table.storeId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "collecto_payment_collections_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.storeId],
			foreignColumns: [stores.id],
			name: "collecto_payment_collections_store_id_stores_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "collecto_payment_collections_order_id_orders_id_fk"
		}).onDelete("cascade"),
]);

export const collectoSettlementAttempts = pgTable("collecto_settlement_attempts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	storeId: uuid("store_id").notNull(),
	orderId: uuid("order_id").notNull(),
	settlementBatchOrderIds: jsonb("settlement_batch_order_ids").default([]).notNull(),
	settlementAmount: integer("settlement_amount").default(0).notNull(),
	settlementStatus: text("settlement_status").default('pending').notNull(),
	walletTransferReference: text("wallet_transfer_reference"),
	walletTransferTransactionId: text("wallet_transfer_transaction_id"),
	walletTransferAmount: integer("wallet_transfer_amount"),
	walletTransferStatus: text("wallet_transfer_status"),
	walletTransferMessage: text("wallet_transfer_message"),
	payoutReference: text("payout_reference"),
	payoutTransactionId: text("payout_transaction_id"),
	payoutGateway: text("payout_gateway"),
	payoutAmount: integer("payout_amount"),
	payoutRecipientPhone: text("payout_recipient_phone"),
	payoutRecipientName: text("payout_recipient_name"),
	payoutStatus: text("payout_status"),
	payoutMessage: text("payout_message"),
	rawMetadata: jsonb("raw_metadata").default({}).notNull(),
	initiatedAt: timestamp("initiated_at", { mode: 'string' }),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	failedAt: timestamp("failed_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("collecto_settlement_attempts_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("collecto_settlement_attempts_order_idx").using("btree", table.orderId.asc().nullsLast().op("uuid_ops")),
	index("collecto_settlement_attempts_status_idx").using("btree", table.settlementStatus.asc().nullsLast().op("text_ops")),
	index("collecto_settlement_attempts_tenant_store_idx").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops"), table.storeId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "collecto_settlement_attempts_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.storeId],
			foreignColumns: [stores.id],
			name: "collecto_settlement_attempts_store_id_stores_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "collecto_settlement_attempts_order_id_orders_id_fk"
		}).onDelete("cascade"),
]);

export const cartItems = pgTable("cart_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	cartId: uuid("cart_id").notNull(),
	productId: uuid("product_id").notNull(),
	storeId: uuid("store_id").notNull(),
	quantity: integer().default(1).notNull(),
	selectedOptions: jsonb("selected_options").default([]).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("cart_item_cart_idx").using("btree", table.cartId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.cartId],
			foreignColumns: [carts.id],
			name: "cart_items_cart_id_carts_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "cart_items_product_id_products_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.storeId],
			foreignColumns: [stores.id],
			name: "cart_items_store_id_stores_id_fk"
		}).onDelete("cascade"),
	unique("cart_item_unique").on(table.cartId, table.productId, table.selectedOptions),
]);

export const mediaObjects = pgTable("media_objects", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	blobUrl: text("blob_url").notNull(),
	blobPathname: text("blob_pathname").notNull(),
	contentType: text("content_type").notNull(),
	source: text().default('upload').notNull(),
	sourceMediaId: text("source_media_id"),
	sourceMetadata: jsonb("source_metadata"),
	isPublic: boolean("is_public").default(true).notNull(),
	lastSyncedAt: timestamp("last_synced_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("media_objects_blob_pathname_idx").using("btree", table.blobPathname.asc().nullsLast().op("text_ops")),
	index("media_objects_source_idx").using("btree", table.source.asc().nullsLast().op("text_ops")),
	index("media_objects_tenant_idx").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "media_objects_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
]);

export const storeCollections = pgTable("store_collections", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	storeId: uuid("store_id").notNull(),
	name: text().notNull(),
	slug: text().notNull(),
	image: text(),
	sortOrder: integer("sort_order").default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("store_collections_store_idx").using("btree", table.storeId.asc().nullsLast().op("uuid_ops")),
	index("store_collections_store_sort_idx").using("btree", table.storeId.asc().nullsLast().op("int4_ops"), table.sortOrder.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "store_collections_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.storeId],
			foreignColumns: [stores.id],
			name: "store_collections_store_id_stores_id_fk"
		}).onDelete("cascade"),
	unique("store_collections_store_slug_unique").on(table.storeId, table.slug),
	unique("store_collections_store_name_unique").on(table.storeId, table.name),
]);

export const carts = pgTable("carts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("cart_user_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "carts_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const storefrontSessions = pgTable("storefront_sessions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	storeId: uuid("store_id").notNull(),
	sessionId: text("session_id").notNull(),
	userId: text("user_id"),
	firstSeenAt: timestamp("first_seen_at", { mode: 'string' }).defaultNow().notNull(),
	lastSeenAt: timestamp("last_seen_at", { mode: 'string' }).defaultNow().notNull(),
	visitCount: integer("visit_count").default(1).notNull(),
	isReturning: boolean("is_returning").default(false).notNull(),
	referrer: text(),
	utmSource: text("utm_source"),
	utmMedium: text("utm_medium"),
	utmCampaign: text("utm_campaign"),
	deviceType: text("device_type"),
	country: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("storefront_sessions_first_seen_idx").using("btree", table.storeId.asc().nullsLast().op("timestamp_ops"), table.firstSeenAt.asc().nullsLast().op("uuid_ops")),
	index("storefront_sessions_last_seen_idx").using("btree", table.storeId.asc().nullsLast().op("timestamp_ops"), table.lastSeenAt.asc().nullsLast().op("timestamp_ops")),
	index("storefront_sessions_tenant_store_idx").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops"), table.storeId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "storefront_sessions_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.storeId],
			foreignColumns: [stores.id],
			name: "storefront_sessions_store_id_stores_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "storefront_sessions_user_id_user_id_fk"
		}).onDelete("set null"),
	unique("storefront_sessions_store_session_unique").on(table.storeId, table.sessionId),
]);

export const categories = pgTable("categories", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	slug: text().notNull(),
	image: text(),
	parentId: uuid("parent_id"),
	level: integer().default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("categories_parent_idx").using("btree", table.parentId.asc().nullsLast().op("uuid_ops")),
	index("categories_slug_idx").using("btree", table.slug.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.parentId],
			foreignColumns: [table.id],
			name: "categories_parent_id_fk"
		}).onDelete("set null"),
	unique("categories_slug_unique").on(table.slug),
]);

export const storefrontEvents = pgTable("storefront_events", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	storeId: uuid("store_id").notNull(),
	eventType: text("event_type").notNull(),
	userId: text("user_id"),
	sessionId: text("session_id").notNull(),
	orderId: uuid("order_id"),
	productId: uuid("product_id"),
	quantity: integer(),
	amount: integer(),
	currency: text(),
	referrer: text(),
	utmSource: text("utm_source"),
	utmMedium: text("utm_medium"),
	utmCampaign: text("utm_campaign"),
	userAgent: text("user_agent"),
	ipHash: text("ip_hash"),
	meta: jsonb().default({}),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("storefront_events_created_idx").using("btree", table.storeId.asc().nullsLast().op("timestamp_ops"), table.createdAt.asc().nullsLast().op("uuid_ops")),
	index("storefront_events_product_idx").using("btree", table.productId.asc().nullsLast().op("uuid_ops")),
	index("storefront_events_session_idx").using("btree", table.storeId.asc().nullsLast().op("uuid_ops"), table.sessionId.asc().nullsLast().op("uuid_ops")),
	index("storefront_events_tenant_store_idx").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops"), table.storeId.asc().nullsLast().op("uuid_ops")),
	index("storefront_events_type_idx").using("btree", table.storeId.asc().nullsLast().op("text_ops"), table.eventType.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "storefront_events_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.storeId],
			foreignColumns: [stores.id],
			name: "storefront_events_store_id_stores_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "storefront_events_user_id_user_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "storefront_events_order_id_orders_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "storefront_events_product_id_products_id_fk"
		}).onDelete("set null"),
]);

export const account = pgTable("account", {
	id: text().primaryKey().notNull(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id").notNull(),
	password: text(),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at", { mode: 'string' }),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { mode: 'string' }),
	scope: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
}, (table) => [
	index("account_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "account_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const products = pgTable("products", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	storeId: uuid("store_id").notNull(),
	productName: text("product_name").notNull(),
	slug: text().notNull(),
	description: text(),
	priceAmount: integer("price_amount").default(0).notNull(),
	originalPriceAmount: integer("original_price_amount"),
	currency: text().default('UGX').notNull(),
	quantity: integer().default(0).notNull(),
	status: text().default('draft').notNull(),
	rating: integer().default(0),
	ratingCount: integer("rating_count").default(0),
	source: text().default('manual').notNull(),
	sourceId: text("source_id"),
	sourceUrl: text("source_url"),
	variants: jsonb().default(null),
	viewCount: integer("view_count").default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
}, (table) => [
	index("products_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("products_store_status_idx").using("btree", table.storeId.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("text_ops")),
	index("products_store_updated_idx").using("btree", table.storeId.asc().nullsLast().op("timestamp_ops"), table.updatedAt.asc().nullsLast().op("timestamp_ops")),
	index("products_tenant_store_idx").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops"), table.storeId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "products_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.storeId],
			foreignColumns: [stores.id],
			name: "products_store_id_stores_id_fk"
		}).onDelete("cascade"),
	unique("products_store_slug_unique").on(table.storeId, table.slug),
]);

export const whatsappMessageLogs = pgTable("whatsapp_message_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	messageId: text("message_id").notNull(),
	phone: text().notNull(),
	orderId: uuid("order_id"),
	category: text(),
	billable: boolean().default(false).notNull(),
	pricing: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "whatsapp_message_logs_order_id_orders_id_fk"
		}),
]);
