import { db, carts, cartItems, eq, and } from "@shopvendly/db";

export const cartRepo = {
  async findByUserId(userId: string) {
    return db.query.carts.findFirst({
      where: eq(carts.userId, userId),
    });
  },

  async create(userId: string) {
    const [cart] = await db.insert(carts).values({ userId }).returning();
    return cart;
  },

  async findItemsByCartId(cartId: string) {
    return db.query.cartItems.findMany({
      where: eq(cartItems.cartId, cartId),
      with: {
        product: {
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
            },
            store: true,
          },
        },
      },
    });
  },

  async findItem(cartId: string, productId: string, selectedOptions: any) {
    return db.query.cartItems.findFirst({
      where: and(
        eq(cartItems.cartId, cartId),
        eq(cartItems.productId, productId),
        eq(cartItems.selectedOptions, selectedOptions),
      ),
    });
  },

  async updateItem(itemId: string, quantity: number, selectedOptions: any) {
    const [updated] = await db
      .update(cartItems)
      .set({ 
        quantity, 
        updatedAt: new Date(), 
        selectedOptions 
      })
      .where(eq(cartItems.id, itemId))
      .returning();
    return updated;
  },

  async insertItem(data: typeof cartItems.$inferInsert) {
    const [newItem] = await db
      .insert(cartItems)
      .values(data)
      .returning();
    return newItem;
  },

  async deleteItem(itemId: string) {
    await db.delete(cartItems).where(eq(cartItems.id, itemId));
  },

  async deleteItemsByQuery(cartId: string, productId?: string, selectedOptions?: any) {
    const conditions = [eq(cartItems.cartId, cartId)];
    if (productId) conditions.push(eq(cartItems.productId, productId));
    if (selectedOptions) conditions.push(eq(cartItems.selectedOptions, selectedOptions));
    
    await db.delete(cartItems).where(and(...conditions));
  },

  async clearCart(cartId: string, storeId?: string) {
    if (storeId) {
      await db
        .delete(cartItems)
        .where(
          and(eq(cartItems.cartId, cartId), eq(cartItems.storeId, storeId)),
        );
    } else {
      await db.delete(cartItems).where(eq(cartItems.cartId, cartId));
    }
  },
};
