import { and, eq, isNull } from "@shopvendly/db";
import { db } from "@shopvendly/db/db";
import { tenants } from "@shopvendly/db/schema";

export const tenantRepo = {
  async findSlugById(id: string) {
    return db.query.tenants.findFirst({
      where: eq(tenants.id, id),
      columns: { slug: true },
    });
  },

  async findSellerByBillingEmail(email: string) {
    return db.query.tenants.findFirst({
      where: and(eq(tenants.billingEmail, email), isNull(tenants.deletedAt)),
      columns: {
        id: true,
        slug: true,
      },
    });
  },
};
