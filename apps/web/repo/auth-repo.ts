import { db } from "@shopvendly/db/db";
import { and, eq } from "@shopvendly/db";
import { users, session as sessionTable, stores, tenants, tenantMemberships } from "@shopvendly/db/schema";

export const authRepo = {
  async findUserByEmail(email: string) {
    return db.query.users.findFirst({
      where: eq(users.email, email),
    });
  },

  async createSession(data: {
    id: string;
    token: string;
    userId: string;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
    ipAddress: string | null;
    userAgent: string | null;
  }) {
    await db.insert(sessionTable).values(data);
  },

  async findStoreByClaimedEmail(email: string) {
    return db.query.stores.findFirst({
      where: eq(stores.claimedByEmail, email),
      columns: { id: true, slug: true, name: true, tenantId: true },
    });
  },

  async findTenantMembership(tenantId: string, userId: string) {
    return db.query.tenantMemberships.findFirst({
      where: and(
        eq(tenantMemberships.tenantId, tenantId),
        eq(tenantMemberships.userId, userId)
      ),
    });
  },

  async addTenantMembership(tenantId: string, userId: string, role: "owner" | "admin" | "member") {
    await db.insert(tenantMemberships).values({ tenantId, userId, role });
  },

  async resetTenantOnboarding(tenantId: string) {
    await db
      .update(tenants)
      .set({
        status: "onboarding",
        onboardingStep: "signup",
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, tenantId));
  },
};
