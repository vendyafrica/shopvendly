import { and, eq, isNull } from "@shopvendly/db";
import { db } from "@shopvendly/db/db";
import { products } from "@shopvendly/db/schema";

export const productsAdminRepo = {
  async updateCurrencyByStore(storeId: string, tenantId: string, currency: "UGX" | "KES" | "USD") {
    await db
      .update(products)
      .set({ currency, updatedAt: new Date() })
      .where(
        and(
          eq(products.storeId, storeId),
          eq(products.tenantId, tenantId),
          isNull(products.deletedAt)
        )
      );
  },
};
