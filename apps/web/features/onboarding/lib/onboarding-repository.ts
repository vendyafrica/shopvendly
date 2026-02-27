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

        const [membership] = await db.insert(tenantMemberships).values({
            tenantId: tenant.id,
            userId,
            role: "owner",
        }).returning();

        const [store] = await db.insert(stores).values({
            tenantId: tenant.id,
            name: data.store.storeName,
            slug: storeSlug,
            description: data.store.storeDescription,
            categories: data.business.categories,
            storeContactEmail: email,
            storeContactPhone: data.personal.phoneNumber,
            storeAddress: data.store.storeLocation ?? null,
            status: true,
        }).returning();

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
}

export const onboardingRepository = new OnboardingRepository();
