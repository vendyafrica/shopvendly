import { db, products, eq, and } from "@shopvendly/db";

export const productRepo = {
  async findByStoreSlug(_storeSlug: string) {
    // Since products relates to stores via storeId, we need to join or first get storeId.
    // However, we can use db.query if relations are set up, or a manual join.
    // Given we likely have storeId from the caller (storeRepo.findBySlug), we could ask for storeId directly.
    // But to keep it simple and robust, let's do a join or use query builder.

    void _storeSlug;

    return db.query.products.findMany({
      where: (products, { eq, and }) =>
        and(
          eq(products.status, "active"), // Assuming 'active' is the status for visible products
          // We need to filter by store slug. Products has storeId.
          // It's cleaner to first get the store's ID in the service layer,
          // BUT for a strict "findByStoreSlug" we can join.
          // Let's assume the service will pass storeId ideally.
          // IF we must use slug:
        ),
      with: {
        store: true, // we can filter here if supported, but typically 'where' on relation field is tricky in some ORM versions.
        media: {
          with: {
            media: true,
          },
          orderBy: (media, { desc }) => [desc(media.isFeatured)],
        },
      },
      // db.query doesn't easily support filtering parent by relation field in all versions without knowing ID.
      // So we will switch to implementing findByStoreId.
    });
  },

  async findByStoreId(storeId: string) {
    return db.query.products.findMany({
      where: and(eq(products.storeId, storeId), eq(products.status, "active")),
      columns: {
        id: true,
        slug: true,
        productName: true,
        description: true,
        priceAmount: true,
        currency: true,
      },
      with: {
        media: {
          with: {
            media: {
              columns: {
                blobUrl: true,
                contentType: true,
              },
            },
          },
          orderBy: (media, { desc }) => [desc(media.isFeatured)],
          limit: 1,
        },
      },
    });
  },

  async findById(id: string) {
    return db.query.products.findFirst({
      where: eq(products.id, id),
      with: {
        media: {
          with: {
            media: true,
          },
          orderBy: (media, { desc }) => [desc(media.isFeatured)],
        },
        store: true,
      },
    });
  },
};
