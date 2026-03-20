import { db } from "@shopvendly/db/db";
import { eq } from "@shopvendly/db";
import { tenantMemberships } from "@shopvendly/db/schema";

export const ordersRepo = {
  async findTenantIdByUserId(userId: string) {
    const membership = await db.query.tenantMemberships.findFirst({
      where: eq(tenantMemberships.userId, userId),
    });

    return membership?.tenantId ?? null;
  },
};
