import { relations } from "drizzle-orm/relations";
import { user, session, tenants, tenantMemberships, stores, products, productCategories, categories, storeCollections, productCollections, productMedia, mediaObjects, productRatings, instagramAccounts, instagramMediaJobs, customers, orderItems, orders, superAdmins, collectoPaymentCollections, collectoSettlementAttempts, carts, cartItems, storefrontSessions, storefrontEvents, account, whatsappMessageLogs } from "./schema";

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	sessions: many(session),
	tenantMemberships: many(tenantMemberships),
	productRatings: many(productRatings),
	instagramAccounts: many(instagramAccounts),
	customers: many(customers),
	superAdmins: many(superAdmins),
	carts: many(carts),
	storefrontSessions: many(storefrontSessions),
	storefrontEvents: many(storefrontEvents),
	accounts: many(account),
}));

export const tenantMembershipsRelations = relations(tenantMemberships, ({one}) => ({
	tenant: one(tenants, {
		fields: [tenantMemberships.tenantId],
		references: [tenants.id]
	}),
	user: one(user, {
		fields: [tenantMemberships.userId],
		references: [user.id]
	}),
}));

export const tenantsRelations = relations(tenants, ({many}) => ({
	tenantMemberships: many(tenantMemberships),
	stores: many(stores),
	productMedias: many(productMedia),
	instagramAccounts: many(instagramAccounts),
	instagramMediaJobs: many(instagramMediaJobs),
	customers: many(customers),
	orderItems: many(orderItems),
	orders: many(orders),
	collectoPaymentCollections: many(collectoPaymentCollections),
	collectoSettlementAttempts: many(collectoSettlementAttempts),
	mediaObjects: many(mediaObjects),
	storeCollections: many(storeCollections),
	storefrontSessions: many(storefrontSessions),
	storefrontEvents: many(storefrontEvents),
	products: many(products),
}));

export const storesRelations = relations(stores, ({one, many}) => ({
	tenant: one(tenants, {
		fields: [stores.tenantId],
		references: [tenants.id]
	}),
	customers: many(customers),
	orders: many(orders),
	collectoPaymentCollections: many(collectoPaymentCollections),
	collectoSettlementAttempts: many(collectoSettlementAttempts),
	cartItems: many(cartItems),
	storeCollections: many(storeCollections),
	storefrontSessions: many(storefrontSessions),
	storefrontEvents: many(storefrontEvents),
	products: many(products),
}));

export const productCategoriesRelations = relations(productCategories, ({one}) => ({
	product: one(products, {
		fields: [productCategories.productId],
		references: [products.id]
	}),
	category: one(categories, {
		fields: [productCategories.categoryId],
		references: [categories.id]
	}),
}));

export const productsRelations = relations(products, ({one, many}) => ({
	productCategories: many(productCategories),
	productCollections: many(productCollections),
	productMedias: many(productMedia),
	productRatings: many(productRatings),
	orderItems: many(orderItems),
	cartItems: many(cartItems),
	storefrontEvents: many(storefrontEvents),
	tenant: one(tenants, {
		fields: [products.tenantId],
		references: [tenants.id]
	}),
	store: one(stores, {
		fields: [products.storeId],
		references: [stores.id]
	}),
}));

export const categoriesRelations = relations(categories, ({one, many}) => ({
	productCategories: many(productCategories),
	category: one(categories, {
		fields: [categories.parentId],
		references: [categories.id],
		relationName: "categories_parentId_categories_id"
	}),
	categories: many(categories, {
		relationName: "categories_parentId_categories_id"
	}),
}));

export const productCollectionsRelations = relations(productCollections, ({one}) => ({
	storeCollection: one(storeCollections, {
		fields: [productCollections.collectionId],
		references: [storeCollections.id]
	}),
	product: one(products, {
		fields: [productCollections.productId],
		references: [products.id]
	}),
}));

export const storeCollectionsRelations = relations(storeCollections, ({one, many}) => ({
	productCollections: many(productCollections),
	tenant: one(tenants, {
		fields: [storeCollections.tenantId],
		references: [tenants.id]
	}),
	store: one(stores, {
		fields: [storeCollections.storeId],
		references: [stores.id]
	}),
}));

export const productMediaRelations = relations(productMedia, ({one}) => ({
	tenant: one(tenants, {
		fields: [productMedia.tenantId],
		references: [tenants.id]
	}),
	product: one(products, {
		fields: [productMedia.productId],
		references: [products.id]
	}),
	mediaObject: one(mediaObjects, {
		fields: [productMedia.mediaId],
		references: [mediaObjects.id]
	}),
}));

export const mediaObjectsRelations = relations(mediaObjects, ({one, many}) => ({
	productMedias: many(productMedia),
	tenant: one(tenants, {
		fields: [mediaObjects.tenantId],
		references: [tenants.id]
	}),
}));

export const productRatingsRelations = relations(productRatings, ({one}) => ({
	product: one(products, {
		fields: [productRatings.productId],
		references: [products.id]
	}),
	user: one(user, {
		fields: [productRatings.userId],
		references: [user.id]
	}),
}));

export const instagramAccountsRelations = relations(instagramAccounts, ({one, many}) => ({
	tenant: one(tenants, {
		fields: [instagramAccounts.tenantId],
		references: [tenants.id]
	}),
	user: one(user, {
		fields: [instagramAccounts.userId],
		references: [user.id]
	}),
	instagramMediaJobs: many(instagramMediaJobs),
}));

export const instagramMediaJobsRelations = relations(instagramMediaJobs, ({one}) => ({
	tenant: one(tenants, {
		fields: [instagramMediaJobs.tenantId],
		references: [tenants.id]
	}),
	instagramAccount: one(instagramAccounts, {
		fields: [instagramMediaJobs.accountId],
		references: [instagramAccounts.id]
	}),
}));

export const customersRelations = relations(customers, ({one}) => ({
	tenant: one(tenants, {
		fields: [customers.tenantId],
		references: [tenants.id]
	}),
	store: one(stores, {
		fields: [customers.storeId],
		references: [stores.id]
	}),
	user: one(user, {
		fields: [customers.userId],
		references: [user.id]
	}),
}));

export const orderItemsRelations = relations(orderItems, ({one}) => ({
	tenant: one(tenants, {
		fields: [orderItems.tenantId],
		references: [tenants.id]
	}),
	order: one(orders, {
		fields: [orderItems.orderId],
		references: [orders.id]
	}),
	product: one(products, {
		fields: [orderItems.productId],
		references: [products.id]
	}),
}));

export const ordersRelations = relations(orders, ({one, many}) => ({
	orderItems: many(orderItems),
	tenant: one(tenants, {
		fields: [orders.tenantId],
		references: [tenants.id]
	}),
	store: one(stores, {
		fields: [orders.storeId],
		references: [stores.id]
	}),
	collectoPaymentCollections: many(collectoPaymentCollections),
	collectoSettlementAttempts: many(collectoSettlementAttempts),
	storefrontEvents: many(storefrontEvents),
	whatsappMessageLogs: many(whatsappMessageLogs),
}));

export const superAdminsRelations = relations(superAdmins, ({one}) => ({
	user: one(user, {
		fields: [superAdmins.userId],
		references: [user.id]
	}),
}));

export const collectoPaymentCollectionsRelations = relations(collectoPaymentCollections, ({one}) => ({
	tenant: one(tenants, {
		fields: [collectoPaymentCollections.tenantId],
		references: [tenants.id]
	}),
	store: one(stores, {
		fields: [collectoPaymentCollections.storeId],
		references: [stores.id]
	}),
	order: one(orders, {
		fields: [collectoPaymentCollections.orderId],
		references: [orders.id]
	}),
}));

export const collectoSettlementAttemptsRelations = relations(collectoSettlementAttempts, ({one}) => ({
	tenant: one(tenants, {
		fields: [collectoSettlementAttempts.tenantId],
		references: [tenants.id]
	}),
	store: one(stores, {
		fields: [collectoSettlementAttempts.storeId],
		references: [stores.id]
	}),
	order: one(orders, {
		fields: [collectoSettlementAttempts.orderId],
		references: [orders.id]
	}),
}));

export const cartItemsRelations = relations(cartItems, ({one}) => ({
	cart: one(carts, {
		fields: [cartItems.cartId],
		references: [carts.id]
	}),
	product: one(products, {
		fields: [cartItems.productId],
		references: [products.id]
	}),
	store: one(stores, {
		fields: [cartItems.storeId],
		references: [stores.id]
	}),
}));

export const cartsRelations = relations(carts, ({one, many}) => ({
	cartItems: many(cartItems),
	user: one(user, {
		fields: [carts.userId],
		references: [user.id]
	}),
}));

export const storefrontSessionsRelations = relations(storefrontSessions, ({one}) => ({
	tenant: one(tenants, {
		fields: [storefrontSessions.tenantId],
		references: [tenants.id]
	}),
	store: one(stores, {
		fields: [storefrontSessions.storeId],
		references: [stores.id]
	}),
	user: one(user, {
		fields: [storefrontSessions.userId],
		references: [user.id]
	}),
}));

export const storefrontEventsRelations = relations(storefrontEvents, ({one}) => ({
	tenant: one(tenants, {
		fields: [storefrontEvents.tenantId],
		references: [tenants.id]
	}),
	store: one(stores, {
		fields: [storefrontEvents.storeId],
		references: [stores.id]
	}),
	user: one(user, {
		fields: [storefrontEvents.userId],
		references: [user.id]
	}),
	order: one(orders, {
		fields: [storefrontEvents.orderId],
		references: [orders.id]
	}),
	product: one(products, {
		fields: [storefrontEvents.productId],
		references: [products.id]
	}),
}));

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));

export const whatsappMessageLogsRelations = relations(whatsappMessageLogs, ({one}) => ({
	order: one(orders, {
		fields: [whatsappMessageLogs.orderId],
		references: [orders.id]
	}),
}));