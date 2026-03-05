"use client";

import { useState } from "react";
import { Button } from "@shopvendly/ui/components/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  MinusSignIcon,
  PlusSignIcon,
  Tick02Icon,
  FavouriteIcon,
} from "@hugeicons/core-free-icons";
import { useCart } from "@/features/cart/context/cart-context";
import { useWishlist } from "@/hooks/use-wishlist";

interface ProductActionsProduct {
  id: string;
  name: string;
  price: number;
  currency: string;
  images: string[];
  mediaItems?: { url: string; contentType?: string | null }[];
  slug: string;
  availableQuantity?: number | null;
  store: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string | null;
  };
}

interface ProductActionsProps {
  product: ProductActionsProduct;
}

export function ProductActions({ product }: ProductActionsProps) {
  const { addItem } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const maxQuantity = product.availableQuantity ?? Number.POSITIVE_INFINITY;
  const isOutOfStock = maxQuantity <= 0;

  const handleToggleWishlist = () => {
    toggleWishlist({
      id: product.id,
      name: product.name,
      price: product.price,
      currency: product.currency,
      image: product.images?.[0],
      contentType: product.mediaItems?.[0]?.contentType || undefined,
      store: {
        id: product.store.id,
        name: product.store.name,
        slug: product.store.slug,
      },
    });
  };

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => Math.max(1, Math.min(maxQuantity, prev + delta)));
  };

  const handleAddToCart = () => {
    if (!product) return;

    if (isOutOfStock) return;

    addItem(
      {
        id: product.id,
        product: {
          id: product.id,
          name: product.name,
          price: product.price,
          currency: product.currency,
          image: product.images[0],
          contentType: product.mediaItems?.[0]?.contentType || undefined,
          slug: product.slug,
          availableQuantity: product.availableQuantity ?? undefined,
        },
        store: {
          id: product.store.id,
          name: product.store.name,
          slug: product.store.slug,
          logoUrl: product.store.logoUrl,
        },
      },
      quantity,
    );

    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const wishlisted = isInWishlist(product.id);

  return (
    <div className="w-full mt-1">
      {/* Quantity */}
      <div className="flex items-center justify-between border-b border-neutral-100 pb-5 mb-5">
        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Quantity</span>
        <div className="flex items-center gap-5">
          <button
            onClick={() => handleQuantityChange(-1)}
            className="p-1.5 hover:bg-neutral-100 rounded-md text-neutral-600 hover:text-neutral-900 transition-all"
            disabled={quantity <= 1}
          >
            <HugeiconsIcon icon={MinusSignIcon} size={18} />
          </button>
          <span className="text-base font-semibold w-6 text-center tabular-nums">{quantity}</span>
          <button
            onClick={() => handleQuantityChange(1)}
            className="p-1.5 hover:bg-neutral-100 rounded-md text-neutral-600 hover:text-neutral-900 transition-all"
            disabled={quantity >= maxQuantity}
          >
            <HugeiconsIcon icon={PlusSignIcon} size={18} />
          </button>
        </div>
      </div>

      {/* Buttons */}
      <div className="pt-2">
        <Button
          onClick={handleAddToCart}
          className="w-full h-12 rounded-md bg-primary text-white hover:bg-primary/90 uppercase text-xs tracking-widest font-semibold transition-colors mb-3"
          disabled={isAdded || isOutOfStock}
        >
          {isAdded ? (
            <span className="flex items-center gap-2">
              <HugeiconsIcon icon={Tick02Icon} size={18} />
              Added
            </span>
          ) : (
            `Purchase at ${product.store.name}`
          )}
        </Button>

        <div className="grid grid-cols-1 gap-3">
          <Button
            onClick={handleToggleWishlist}
            variant="outline"
            className={`w-full h-12 rounded-md uppercase text-xs tracking-widest font-semibold transition-all duration-150 border flex items-center justify-center gap-2.5 active:scale-[0.98] hover:-translate-y-0.5 ${
              wishlisted
                ? "border-red-400 bg-red-50 text-red-600 hover:bg-red-100"
                : "border-neutral-200 bg-neutral-50 text-neutral-900 hover:bg-neutral-100"
            }`}
            aria-pressed={wishlisted}
          >
            <HugeiconsIcon
              icon={FavouriteIcon}
              size={18}
              className={wishlisted ? "fill-red-500 text-red-500" : "text-neutral-800"}
            />
            {wishlisted ? "Saved" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
