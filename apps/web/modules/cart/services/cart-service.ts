import { cartRepo } from "@/modules/cart/repo/cart-repo";
import { db } from "@shopvendly/db/db";
import { products } from "@shopvendly/db/schema";
import { eq } from "@shopvendly/db";

type CartSelectedOption = {
  name: string;
  value: string;
};

const normalizeSelectedOptions = (options: CartSelectedOption[] | undefined) => {
  if (!options?.length) return [];
  return options
    .map((option) => ({
      name: option.name.trim(),
      value: option.value.trim(),
    }))
    .filter((option) => option.name.length > 0 && option.value.length > 0);
};

/**
 * Cart Service for serverless environment
 * Handles cart CRUD operations
 */
export const cartService = {
  /**
   * Get or create a cart for a user
   */
  async getUserCart(userId: string) {
    let cart = await cartRepo.findByUserId(userId);

    if (!cart) {
      cart = await cartRepo.create(userId);
    }

    if (!cart) {
      throw new Error("Failed to initialize cart");
    }

    const items = await cartRepo.findItemsByCartId(cart.id);

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
    selectedOptions?: CartSelectedOption[],
  ) {
    const { cart } = await this.getUserCart(userId);
    const normalizedSelectedOptions = normalizeSelectedOptions(selectedOptions);

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

    const maxQuantity =
      typeof product.quantity === "number" && Number.isFinite(product.quantity)
        ? Math.max(product.quantity, 0)
        : Number.POSITIVE_INFINITY;
    const clampedQuantity = Math.min(quantity, maxQuantity);

    const existingItem = await cartRepo.findItem(cart.id, productId, normalizedSelectedOptions);

    if (existingItem) {
      if (clampedQuantity <= 0) {
        await cartRepo.deleteItem(existingItem.id);
        return null;
      }
      return cartRepo.updateItem(existingItem.id, clampedQuantity, normalizedSelectedOptions);
    } else {
      if (clampedQuantity <= 0) return null;
      return cartRepo.insertItem({
        cartId: cart.id,
        productId,
        storeId,
        quantity: clampedQuantity,
        selectedOptions: normalizedSelectedOptions,
      });
    }
  },

  /**
   * Remove an item from the cart
   */
  async removeItem(userId: string, productId: string, selectedOptions?: CartSelectedOption[]) {
    const { cart } = await this.getUserCart(userId);
    const normalizedSelectedOptions = normalizeSelectedOptions(selectedOptions);
    await cartRepo.deleteItemsByQuery(cart.id, productId, normalizedSelectedOptions);
  },

  /**
   * Clear the cart or remove items for a specific store
   */
  async clearCart(userId: string, storeId?: string) {
    const { cart } = await this.getUserCart(userId);
    await cartRepo.clearCart(cart.id, storeId);
  },
};
