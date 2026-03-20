import { and, eq } from "@shopvendly/db";
import { db } from "@shopvendly/db/db";
import { account, instagramAccounts, instagramSyncJobs, mediaObjects, productMedia, products, stores, tenantMemberships } from "@shopvendly/db/schema";

export const instagramRepo = {
  async getImportContext(userId: string, storeId: string) {
    const membership = await this.findTenantMembership(userId);
    if (!membership) {
      return { membership: null, store: null, instagramAuthAccount: null };
    }

    const store = await this.findStoreForTenant(storeId, membership.tenantId);
    const instagramAuthAccount = await this.findAuthAccount(userId);

    return { membership, store, instagramAuthAccount };
  },

  async findTenantMembership(userId: string) {
    return db.query.tenantMemberships.findFirst({
      where: eq(tenantMemberships.userId, userId),
    });
  },

  async findStoreForTenant(storeId: string, tenantId: string) {
    return db.query.stores.findFirst({
      where: and(eq(stores.id, storeId), eq(stores.tenantId, tenantId)),
    });
  },

  async findAuthAccount(userId: string) {
    return db.query.account.findFirst({
      where: and(
        eq(account.userId, userId),
        eq(account.providerId, "instagram")
      ),
    });
  },

  async findTenantMembershipStoreTenantAccount(userId: string, storeId: string) {
    const membership = await this.findTenantMembership(userId);
    if (!membership) return null;

    const store = await this.findStoreForTenant(storeId, membership.tenantId);
    if (!store) return null;

    const instagramAuthAccount = await this.findAuthAccount(userId);
    return { membership, store, instagramAuthAccount };
  },

  async isConnectedForUserAndTenant(userId: string, tenantId: string) {
    const instagramAuthAccount = await db.query.account.findFirst({
      where: and(
        eq(account.userId, userId),
        eq(account.providerId, "instagram")
      ),
    });

    if (!instagramAuthAccount?.accessToken) {
      return { connected: false, imported: false };
    }

    const tenantInstagramAccount = await db.query.instagramAccounts.findFirst({
      where: and(
        eq(instagramAccounts.tenantId, tenantId),
        eq(instagramAccounts.userId, userId)
      ),
      columns: { id: true },
    });

    const hasTenantInstagramAccount = Boolean(tenantInstagramAccount);
    const isConnected = Boolean(instagramAuthAccount?.accessToken) && hasTenantInstagramAccount;

    return { connected: isConnected, imported: false };
  },

  async hasImportedProducts(storeId: string) {
    const existingProduct = await db.query.products.findFirst({
      where: and(
        eq(products.storeId, storeId),
        eq(products.source, "instagram")
      ),
      columns: { id: true },
    });

    return Boolean(existingProduct);
  },

  async hasTenantAccount(tenantId: string, userId: string) {
    return db.query.instagramAccounts.findFirst({
      where: and(
        eq(instagramAccounts.tenantId, tenantId),
        eq(instagramAccounts.userId, userId)
      ),
    });
  },

  async upsertInstagramAccount(tenantId: string, userId: string, values: typeof instagramAccounts.$inferInsert) {
    const existing = await db.query.instagramAccounts.findFirst({
      where: and(
        eq(instagramAccounts.tenantId, tenantId),
        eq(instagramAccounts.userId, userId)
      ),
      columns: { id: true },
    });

    if (existing) {
      const [accountRecord] = await db
        .update(instagramAccounts)
        .set(values)
        .where(eq(instagramAccounts.id, existing.id))
        .returning();
      return accountRecord;
    }

    const [accountRecord] = await db.insert(instagramAccounts).values(values).returning();
    return accountRecord;
  },

  async updateStoreLogo(storeId: string, tenantId: string, logoUrl: string) {
    await db
      .update(stores)
      .set({ logoUrl, updatedAt: new Date() })
      .where(and(eq(stores.id, storeId), eq(stores.tenantId, tenantId)));
  },

  async createSyncJob(tenantId: string, accountId: string, mediaFetched: number) {
    const [job] = await db
      .insert(instagramSyncJobs)
      .values({
        tenantId,
        accountId,
        status: "processing",
        mediaFetched,
        startedAt: new Date(),
      })
      .returning();
    return job;
  },

  async completeSyncJob(jobId: string, productsCreated: number) {
    await db
      .update(instagramSyncJobs)
      .set({
        status: "completed",
        productsCreated,
        completedAt: new Date(),
      })
      .where(eq(instagramSyncJobs.id, jobId));
  },

  async clearInstagramDataForTenant(userId: string, tenantId: string) {
    await db
      .delete(products)
      .where(and(eq(products.tenantId, tenantId), eq(products.source, "instagram")));

    await db
      .delete(mediaObjects)
      .where(and(eq(mediaObjects.tenantId, tenantId), eq(mediaObjects.source, "instagram")));

    await db
      .delete(instagramSyncJobs)
      .where(eq(instagramSyncJobs.tenantId, tenantId));

    await db
      .delete(account)
      .where(and(eq(account.userId, userId), eq(account.providerId, "instagram")));

    await db
      .delete(instagramAccounts)
      .where(and(eq(instagramAccounts.tenantId, tenantId), eq(instagramAccounts.userId, userId)));
  },

  async findActiveByTenantId(tenantId: string) {
    return db.query.instagramAccounts.findFirst({
      where: and(
        eq(instagramAccounts.tenantId, tenantId),
        eq(instagramAccounts.isActive, true)
      )
    });
  },

  async findExistingProductBySource(tenantId: string, storeId: string, source: string, sourceId: string) {
    return db.query.products.findFirst({
      where: and(
        eq(products.tenantId, tenantId),
        eq(products.storeId, storeId),
        eq(products.source, source),
        eq(products.sourceId, sourceId),
      ),
      columns: { id: true },
    });
  },

  async createProduct(values: typeof products.$inferInsert) {
    const [product] = await db.insert(products).values(values).returning();
    return product;
  },

  async createMediaObject(values: typeof mediaObjects.$inferInsert) {
    const [mediaObj] = await db.insert(mediaObjects).values(values).returning();
    return mediaObj;
  },

  async linkProductMedia(values: typeof productMedia.$inferInsert) {
    await db.insert(productMedia).values(values);
  },
};
