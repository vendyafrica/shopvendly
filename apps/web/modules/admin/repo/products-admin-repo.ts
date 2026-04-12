import { and, eq, inArray, isNull } from "@shopvendly/db";
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

  async bulkUpdateStatus(storeId: string, tenantId: string, ids: string[], status: "active" | "deleted") {
    if (status === "active") {
      await db
        .update(products)
        .set({ status: "active", updatedAt: new Date() })
        .where(
          and(
            eq(products.storeId, storeId),
            eq(products.tenantId, tenantId),
            isNull(products.deletedAt),
            inArray(products.id, ids)
          )
        );
      return;
    }

    await db
      .update(products)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(products.storeId, storeId),
          eq(products.tenantId, tenantId),
          isNull(products.deletedAt),
          inArray(products.id, ids)
        )
      );
  },
};
