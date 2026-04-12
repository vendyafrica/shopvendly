import { db } from "@shopvendly/db/db";
import { eq, and } from "@shopvendly/db";
import { tenantMemberships } from "@shopvendly/db/schema";

export const tenantMembershipRepo = {
  async findByUserId(userId: string) {
    return db.query.tenantMemberships.findFirst({
      where: eq(tenantMemberships.userId, userId),
    });
  },

  async findByUserAndTenant(userId: string, tenantId: string) {
    return db.query.tenantMemberships.findFirst({
      where: and(
        eq(tenantMemberships.userId, userId),
        eq(tenantMemberships.tenantId, tenantId)
      ),
    });
  },
};
