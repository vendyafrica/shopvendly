import { and, eq, productRatings, products, sql } from "@shopvendly/db";
import { db } from "@shopvendly/db";

export const productRatingsRepo = {
  async findByProductAndUser(productId: string, userId: string) {
    return db.query.productRatings.findFirst({
      where: and(
        eq(productRatings.productId, productId),
        eq(productRatings.userId, userId)
      ),
    });
  },

  async upsertProductRating(productId: string, userId: string, rating: number) {
    await db
      .insert(productRatings)
      .values({
        productId,
        userId,
        rating,
      })
      .onConflictDoUpdate({
        target: [productRatings.productId, productRatings.userId],
        set: {
          rating,
          updatedAt: new Date(),
        },
      });
  },

  async getProductRatingAggregate(productId: string) {
    const aggregates = await db
      .select({
        average: sql<number>`avg(${productRatings.rating})`,
        count: sql<number>`count(${productRatings.id})`,
      })
      .from(productRatings)
      .where(eq(productRatings.productId, productId));

    return {
      rating: aggregates[0]?.average ? Number(aggregates[0].average) : 0,
      ratingCount: aggregates[0]?.count ? Number(aggregates[0].count) : 0,
    };
  },

  async syncProductRatingSnapshot(productId: string, rating: number, ratingCount: number) {
    await db
      .update(products)
      .set({
        rating: Math.round(rating),
        ratingCount,
      })
      .where(eq(products.id, productId));
  },
};
