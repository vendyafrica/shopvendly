import { db, products, eq, and } from "@shopvendly/db";

export const productRepo = {
  async findByStoreSlug(_storeSlug: string) {
    void _storeSlug;

    return db.query.products.findMany({
      where: (products, { eq, and }) =>
        and(
          eq(products.status, "active"),
        ),
      with: {
        store: true,
        media: {
          with: {
            media: true,
          },
          orderBy: (media, { desc }) => [desc(media.isFeatured)],
        },
      },
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

  async findScopeById(id: string) {
    return db.query.products.findFirst({
      where: and(eq(products.id, id), eq(products.deletedAt, null as never)),
      columns: {
        id: true,
        storeId: true,
        tenantId: true,
      },
    });
  },
};
