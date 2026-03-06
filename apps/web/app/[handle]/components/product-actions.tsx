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
    <div className="w-full">
      {/* Quantity */}
      <div className="flex items-center justify-between border-b border-neutral-100 pb-5">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-500">Quantity</span>
          {Number.isFinite(maxQuantity) && maxQuantity > 0 ? (
            <span className="text-xs font-medium text-neutral-400">
              Only {maxQuantity} left
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-4 rounded-full border border-neutral-200 bg-white px-2 py-1.5">
          <button
            onClick={() => handleQuantityChange(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-600 transition-all hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-35"
            disabled={quantity <= 1}
          >
            <HugeiconsIcon icon={MinusSignIcon} size={20} />
          </button>
          <span className="min-w-8 text-center text-lg font-semibold tabular-nums text-neutral-950">{quantity}</span>
          <button
            onClick={() => handleQuantityChange(1)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-600 transition-all hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-35"
            disabled={quantity >= maxQuantity}
          >
            <HugeiconsIcon icon={PlusSignIcon} size={20} />
          </button>
        </div>
      </div>

      {/* Buttons */}
      <div className="pt-5">
        <Button
          onClick={handleAddToCart}
          className="mb-3 h-14 w-full rounded-xl bg-primary px-5 text-sm font-semibold uppercase tracking-[0.22em] text-white transition-colors hover:bg-primary/90"
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
            className={`h-13 w-full rounded-xl border text-sm font-semibold uppercase tracking-[0.2em] transition-all duration-150 flex items-center justify-center gap-2.5 active:scale-[0.98] ${
              wishlisted
                ? "border-red-300 bg-red-50 text-red-600 hover:bg-red-100"
                : "border-neutral-200 bg-white text-neutral-900 hover:bg-neutral-50"
            }`}
            aria-pressed={wishlisted}
          >
            <HugeiconsIcon
              icon={FavouriteIcon}
              size={20}
              className={wishlisted ? "fill-red-500 text-red-500" : "text-neutral-800"}
            />
            {wishlisted ? "Saved" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
