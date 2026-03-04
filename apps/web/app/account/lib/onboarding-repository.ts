import { db } from "@shopvendly/db/db";
import { tenants, tenantMemberships, stores } from "@shopvendly/db/schema";
import { eq } from "@shopvendly/db";
import type { OnboardingData, CreateTenantResult } from "./models";

class OnboardingRepository {
  async createTenantWithStore(
    userId: string,
    email: string,
    data: Required<OnboardingData>
  ): Promise<CreateTenantResult> {
    const tenantSlug = this.generateSlug(email);
    const storeSlug = await this.ensureUniqueStoreSlug(data.store.storeName);

    const [tenant] = await db.insert(tenants).values({
      fullName: data.personal.fullName,
      slug: tenantSlug,
      phoneNumber: data.personal.phoneNumber,
      billingEmail: email,
      onboardingStep: "complete",
      onboardingData: data,
      status: "active",
    }).returning();

    if (!tenant) {
      throw new Error("Failed to create tenant");
    }

    const [membership] = await db.insert(tenantMemberships).values({
      tenantId: tenant.id,
      userId,
      role: "owner",
    }).returning();

    if (!membership) {
      throw new Error("Failed to create tenant membership");
    }

    const defaultCurrency = data.personal.countryCode === "254" ? "KES" : "UGX";

    const [store] = await db.insert(stores).values({
      tenantId: tenant.id,
      name: data.store.storeName,
      slug: storeSlug,
      description: data.store.storeDescription,
      categories: data.business.categories,
      defaultCurrency,
      storeContactEmail: email,
      storeContactPhone: data.personal.phoneNumber,
      storeAddress: data.store.storeLocation ?? null,
      status: true,
    }).returning();

    if (!store) {
      throw new Error("Failed to create store");
    }

    return {
      tenant,
      store,
      membership,
    };
  }

  async isSlugTaken(slug: string): Promise<boolean> {
    const existing = await db.query.tenants.findFirst({
      where: eq(tenants.slug, slug),
    });
    return !!existing;
  }

  private async ensureUniqueStoreSlug(name: string): Promise<string> {
    let slug = this.generateSlugFromName(name);
    let exists = await this.isStoreSlugTaken(slug);
    let count = 1;
    const originalSlug = slug;

    while (exists) {
      slug = `${originalSlug}-${count}`;
      exists = await this.isStoreSlugTaken(slug);
      count++;
    }

    return slug;
  }

  private async isStoreSlugTaken(slug: string): Promise<boolean> {
    const existing = await db.query.stores.findFirst({
      where: eq(stores.slug, slug),
    });
    return !!existing;
  }

  private generateSlugFromName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 50);
  }

  private generateSlug(input: string): string {
    const base = input
      .toLowerCase()
      .replace(/@.*$/, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 30);

    const suffix = Math.random().toString(36).slice(2, 6);
    return `${base}-${suffix}`;
  }

  async hasTenant(userId: string): Promise<boolean> {
    const membership = await db.query.tenantMemberships.findFirst({
      where: eq(tenantMemberships.userId, userId),
    });
    return !!membership;
  }

  async getMembershipWithTenantStore(userId: string) {
    const membership = await db.query.tenantMemberships.findFirst({
      where: eq(tenantMemberships.userId, userId),
    });

    if (!membership) return null;

    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, membership.tenantId))
      .limit(1);

    const [store] = await db
      .select()
      .from(stores)
      .where(eq(stores.tenantId, membership.tenantId))
      .limit(1);

    if (!tenant || !store) return null;

    return { membership, tenant, store };
  }

  async completeClaimedTenant(
    userId: string,
    email: string,
    data: Required<OnboardingData>
  ): Promise<CreateTenantResult> {
    const existing = await this.getMembershipWithTenantStore(userId);

    if (!existing) {
      throw new Error("No claimed tenant found");
    }

    const defaultCurrency = data.personal.countryCode === "254" ? "KES" : "UGX";

    const [tenant] = await db
      .update(tenants)
      .set({
        fullName: data.personal.fullName,
        phoneNumber: data.personal.phoneNumber,
        billingEmail: email,
        onboardingStep: "complete",
        onboardingData: data,
        status: "active",
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, existing.tenant.id))
      .returning();

    const [store] = await db
      .update(stores)
      .set({
        name: data.store.storeName,
        description: data.store.storeDescription,
        categories: data.business.categories,
        defaultCurrency,
        storeContactEmail: email,
        storeContactPhone: data.personal.phoneNumber,
        storeAddress: data.store.storeLocation ?? null,
        status: true,
        updatedAt: new Date(),
      })
      .where(eq(stores.id, existing.store.id))
      .returning();

    if (!tenant || !store) {
      throw new Error("Failed to complete claimed tenant onboarding");
    }

    return {
      tenant,
      store,
      membership: existing.membership,
    };
  }

  async isPhoneTaken(phoneNumber: string): Promise<boolean> {
    const existing = await db.query.tenants.findFirst({
      where: eq(tenants.phoneNumber, phoneNumber),
    });
    return !!existing;
  }

  async isStoreNameTaken(name: string): Promise<boolean> {
    // using eq for case-insensitive check if it's ilike needed, but usually exact match is fine, or compare lowercase. 
    // Drizzle has ilike, let's use sql lower? Or just exact for now. 
    // Let's use ilike from "drizzle-orm"
    const existing = await db.query.stores.findFirst({
      where: (stores, { ilike }) => ilike(stores.name, name),
    });
    return !!existing;
  }
}

export const onboardingRepository = new OnboardingRepository();
