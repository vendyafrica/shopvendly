import { db } from "@shopvendly/db/db";
import { carts, cartItems, products } from "@shopvendly/db/schema";
import { eq, and } from "@shopvendly/db";

/**
 * Cart Service for serverless environment
 * Handles cart CRUD operations
 */
export const cartService = {
  /**
   * Get or create a cart for a user
   */
  async getUserCart(userId: string) {
    let cart = await db.query.carts.findFirst({
      where: eq(carts.userId, userId),
    });

    if (!cart) {
      [cart] = await db.insert(carts).values({ userId }).returning();
    }

    if (!cart) {
      throw new Error("Failed to initialize cart");
    }

    const items = await db.query.cartItems.findMany({
      where: eq(cartItems.cartId, cart.id),
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

    return { cart, items } as const;
  },

  /**
   * Add or update an item in the cart
   */
  async upsertItem(
    userId: string,
    productId: string,
    storeId: string,
    quantity: number,
  ) {
    const { cart } = await this.getUserCart(userId);

    const product = await db.query.products.findFirst({
      where: eq(products.id, productId),
      columns: {
        id: true,
        quantity: true,
        storeId: true,
      },
    });

    if (!product || product.storeId !== storeId) {
      return null;
    }

    const maxQuantity = product.quantity && product.quantity > 0 ? product.quantity : Number.POSITIVE_INFINITY;
    const clampedQuantity = Math.min(quantity, maxQuantity);

    const existingItem = await db.query.cartItems.findFirst({
      where: and(
        eq(cartItems.cartId, cart.id),
        eq(cartItems.productId, productId),
      ),
    });

    if (existingItem) {
      if (clampedQuantity <= 0) {
        await db.delete(cartItems).where(eq(cartItems.id, existingItem.id));
        return null;
      }
      const [updated] = await db
        .update(cartItems)
        .set({ quantity: clampedQuantity, updatedAt: new Date() })
        .where(eq(cartItems.id, existingItem.id))
        .returning();
      return updated;
    } else {
      if (clampedQuantity <= 0) return null;
      const [newItem] = await db
        .insert(cartItems)
        .values({
          cartId: cart.id,
          productId,
          storeId,
          quantity: clampedQuantity,
        })
        .returning();
      return newItem;
    }
  },

  /**
   * Remove an item from the cart
   */
  async removeItem(userId: string, productId: string) {
    const { cart } = await this.getUserCart(userId);
    await db
      .delete(cartItems)
      .where(
        and(eq(cartItems.cartId, cart.id), eq(cartItems.productId, productId)),
      );
  },

  /**
   * Clear the cart or remove items for a specific store
   */
  async clearCart(userId: string, storeId?: string) {
    const { cart } = await this.getUserCart(userId);

    if (storeId) {
      await db
        .delete(cartItems)
        .where(
          and(eq(cartItems.cartId, cart.id), eq(cartItems.storeId, storeId)),
        );
    } else {
      await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));
    }
  },
};
