"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { useAppSession } from "@/contexts/app-session-context";
import { trackStorefrontEvents } from "@/modules/storefront/services/storefront-tracking";

const API_BASE = "";
const CART_STORAGE_KEY = "vendly_cart";

export interface CartSelectedOption {
    name: string;
    value: string;
}

export interface CartItem {
    id: string;
    quantity: number;
    product: {
        id: string;
        name: string;
        price: number;
        originalPrice?: number | null;
        currency: string;
        image?: string;
        contentType?: string;
        slug: string;
        availableQuantity?: number;
        selectedOptions?: CartSelectedOption[];
    };
    store: {
        id: string;
        name: string;
        slug: string;
        logoUrl?: string | null;
    };
}

interface CartContextType {
    items: CartItem[];
    addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
    removeItem: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    clearStoreFromCart: (storeId: string) => void;
    cartTotal: number;
    itemCount: number;
    totalQuantity: number;
    itemsByStore: Record<string, CartItem[]>; // Grouped by storeId
    isLoaded: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const resolveMaxQuantity = (availableQuantity?: number | null) => {
    if (typeof availableQuantity === "number" && Number.isFinite(availableQuantity)) {
        return Math.max(availableQuantity, 0);
    }
    return Number.POSITIVE_INFINITY;
};

const normalizeSelectedOptions = (value: unknown): CartSelectedOption[] => {
    if (!Array.isArray(value)) return [];
    return value
        .map((option) => {
            if (!option || typeof option !== "object") return null;
            const candidate = option as { name?: unknown; value?: unknown };
            if (typeof candidate.name !== "string" || typeof candidate.value !== "string") return null;
            const name = candidate.name.trim();
            const optionValue = candidate.value.trim();
            if (!name || !optionValue) return null;
            return { name, value: optionValue };
        })
        .filter((option): option is CartSelectedOption => Boolean(option));
};

const buildCartLineId = (productId: string, selectedOptions: CartSelectedOption[] = []) => {
    if (!productId) return crypto.randomUUID();
    if (selectedOptions.length === 0) return productId;
    const signature = [...selectedOptions]
        .sort((a, b) => {
            const aKey = `${a.name}:${a.value}`.toLowerCase();
            const bKey = `${b.name}:${b.value}`.toLowerCase();
            return aKey.localeCompare(bKey);
        })
        .map((option) => `${option.name}:${option.value}`)
        .join("|");
    return `${productId}::${signature}`;
};

const mergeCartItems = (primary: CartItem[], secondary: CartItem[]) => {
    const merged = new Map<string, CartItem>();

    for (const item of primary) {
        merged.set(item.id, { ...item });
    }

    for (const item of secondary) {
        const existing = merged.get(item.id);
        if (existing) {
            const maxQuantity = resolveMaxQuantity(existing.product.availableQuantity);
            merged.set(item.id, {
                ...existing,
                quantity: Math.min(existing.quantity + item.quantity, maxQuantity),
            });
        } else {
            merged.set(item.id, { ...item });
        }
    }

    return Array.from(merged.values());
};

const sanitizeCartItems = (items: unknown): CartItem[] => {
    if (!Array.isArray(items)) return [];
    return items
        .filter((item): item is CartItem => Boolean(item && typeof item === "object"))
        .map((item) => ({
            ...item,
            product: {
                ...item.product,
                originalPrice: typeof item.product?.originalPrice === "number" ? item.product.originalPrice : null,
                availableQuantity:
                    typeof item.product?.availableQuantity === "number" && Number.isFinite(item.product.availableQuantity)
                        ? Math.max(item.product.availableQuantity, 0)
                        : undefined,
                selectedOptions: normalizeSelectedOptions(item.product?.selectedOptions),
            },
            id: buildCartLineId(
                item.product?.id,
                normalizeSelectedOptions(item.product?.selectedOptions)
            )
        }));
};

async function syncItemsWithLatestProducts(cartItems: CartItem[]): Promise<CartItem[]> {
    if (cartItems.length === 0) return cartItems;

    const storeSlugs = Array.from(
        new Set(
            cartItems
                .map((item) => item.store.slug)
                .filter((slug): slug is string => typeof slug === "string" && slug.length > 0)
        )
    );

    if (storeSlugs.length === 0) return cartItems;

    const latestProductsByStore = new Map<string, Map<string, {
        id: string;
        price: number;
        originalPrice?: number | null;
        currency: string;
        image: string | null;
        contentType?: string | null;
        slug: string;
    }>>();

    await Promise.all(storeSlugs.map(async (storeSlug) => {
        try {
            const response = await fetch(`${API_BASE}/api/storefront/${storeSlug}/products`, {
                cache: "no-store",
            });

            if (!response.ok) return;

            const products = await response.json() as Array<{
                id: string;
                price: number;
                originalPrice?: number | null;
                currency: string;
                image: string | null;
                contentType?: string | null;
                slug: string;
            }>;

            latestProductsByStore.set(
                storeSlug,
                new Map(products.map((product) => [product.id, product]))
            );
        } catch (error) {
            console.error(`Failed to refresh cart prices for store ${storeSlug}`, error);
        }
    }));

    return cartItems.map((item) => {
        const latestProduct = latestProductsByStore.get(item.store.slug)?.get(item.product.id);
        if (!latestProduct) {
            return item;
        }

        return {
            ...item,
            product: {
                ...item.product,
                price: latestProduct.price,
                originalPrice: latestProduct.originalPrice ?? null,
                currency: latestProduct.currency,
                image: latestProduct.image ?? item.product.image,
                contentType: latestProduct.contentType ?? item.product.contentType,
                slug: latestProduct.slug || item.product.slug,
            },
        };
    });
}

export function CartProvider({ children }: { children: React.ReactNode }) {
    const { session } = useAppSession();
    const [items, setItems] = useState<CartItem[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const isSyncingRef = useRef(false);
    const prevUserIdRef = useRef<string | undefined>(undefined);

    // Initial Load
    useEffect(() => {
        const loadCart = async () => {
            if (session?.user) {
                try {
                    const res = await fetch(`${API_BASE}/api/cart`, {
                        headers: { "x-user-id": session.user.id }
                    });
                    if (res.ok) {
                        const serverItems = sanitizeCartItems(await res.json());
                        const stored = localStorage.getItem(CART_STORAGE_KEY);
                        const localItems = stored ? sanitizeCartItems(JSON.parse(stored)) : [];
                        const mergedItems = mergeCartItems(serverItems, localItems);
                        setItems(await syncItemsWithLatestProducts(mergedItems));
                    } else {
                        setItems([]);
                    }
                } catch (e) {
                    console.error("Failed to fetch cart", e);
                }
            } else {
                const stored = localStorage.getItem(CART_STORAGE_KEY);
                if (stored) {
                    try {
                        const localItems = sanitizeCartItems(JSON.parse(stored));
                        setItems(await syncItemsWithLatestProducts(localItems));
                    } catch (e) {
                        console.error("Failed to parse cart storage", e);
                    }
                }
            }
            setIsLoaded(true);
        };
        loadCart();
    }, [session]);

    // Merge guest cart into server cart when user logs in (one-time per login session)
    useEffect(() => {
        const userId = session?.user?.id;
        const prevUserId = prevUserIdRef.current;

        // Only run when transitioning from logged-out to a logged-in user
        if (!userId || userId === prevUserId || isSyncingRef.current) {
            prevUserIdRef.current = userId;
            return;
        }

        const mergeGuestCart = async () => {
            try {
                isSyncingRef.current = true;

                // Load guest cart from localStorage
                let guestItems: CartItem[] = [];
                try {
                    const guestRaw = localStorage.getItem(CART_STORAGE_KEY);
                    guestItems = guestRaw ? sanitizeCartItems(JSON.parse(guestRaw)) : [];
                } catch {
                    guestItems = [];
                }

                // Nothing to merge
                if (!Array.isArray(guestItems) || guestItems.length === 0) {
                    return;
                }

                // Clear guest storage early to prevent any chance of double-merge on re-renders
                localStorage.removeItem(CART_STORAGE_KEY);

                // Fetch server cart
                const serverRes = await fetch(`${API_BASE}/api/cart`, {
                    headers: { "x-user-id": userId }
                });
                const serverItems: CartItem[] = serverRes.ok ? sanitizeCartItems(await serverRes.json()) : [];

                const mergedItems = mergeCartItems(serverItems, guestItems);

                for (const item of mergedItems) {
                    try {
                        await fetch(`${API_BASE}/api/cart`, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "x-user-id": userId,
                            },
                            body: JSON.stringify({
                                productId: item.product.id,
                                storeId: item.store.id,
                                quantity: item.quantity,
                                selectedOptions: item.product.selectedOptions ?? [],
                            }),
                        });
                    } catch (e) {
                        console.error("Failed to sync guest cart item", e);
                    }
                }

                setItems(mergedItems);
            } catch (e) {
                console.error("Failed to merge guest cart", e);
            } finally {
                isSyncingRef.current = false;
                prevUserIdRef.current = userId;
            }
        };

        void mergeGuestCart();
    }, [session?.user?.id, session?.user, session]);

    // Save changes
    useEffect(() => {
        // Only persist a guest cart. Logged-in carts are persisted server-side.
        if (isLoaded && !session?.user) {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
        } else if (isLoaded && session?.user) {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
        }
    }, [items, isLoaded, session?.user]);

    const addItem = async (newItem: Omit<CartItem, "quantity">, quantity = 1) => {
        if (newItem?.store?.slug && newItem?.product?.id) {
            void trackStorefrontEvents(
                newItem.store.slug,
                [
                    {
                        eventType: "add_to_cart",
                        productId: newItem.product.id,
                        quantity,
                        meta: { productSlug: newItem.product.slug },
                    },
                ],
                { userId: session?.user?.id }
            );
        }

        const normalizedOptions = normalizeSelectedOptions(newItem.product.selectedOptions ?? []);
        const lineId = buildCartLineId(newItem.product.id, normalizedOptions);
        let nextQuantity = quantity;
        const maxQuantity = resolveMaxQuantity(newItem.product.availableQuantity);

        // Optimistic update (also computes the exact quantity we should persist)
        setItems((prev) => {
            const existing = prev.find((item) => item.id === lineId);
            if (existing) {
                nextQuantity = Math.min(existing.quantity + quantity, maxQuantity);
                return prev.map((item) =>
                    item.id === lineId
                        ? { ...item, quantity: nextQuantity }
                        : item
                );
            }
            nextQuantity = Math.min(quantity, maxQuantity);
            return [
                ...prev,
                {
                    ...newItem,
                    id: lineId,
                    product: { ...newItem.product, selectedOptions: normalizedOptions },
                    quantity: nextQuantity,
                },
            ];
        });

        // If maxQuantity is zero or less, do not persist to server
        if (nextQuantity <= 0) {
            return;
        }

        if (session?.user) {
            try {
                await fetch(`${API_BASE}/api/cart`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-user-id": session.user.id
                    },
                    body: JSON.stringify({
                        productId: newItem.product.id,
                        storeId: newItem.store.id,
                        quantity: nextQuantity,
                        selectedOptions: normalizedOptions,
                    })
                });
            } catch (e) {
                console.error("Failed to sync cart add", e);
            }
        }
    };

    const removeItem = async (productId: string) => {
        const target = items.find((item) => item.id === productId);
        setItems((prev) => prev.filter((item) => item.id !== productId));

        if (session?.user && target) {
            try {
                const search = new URLSearchParams({
                    selectedOptions: JSON.stringify(target.product.selectedOptions ?? []),
                });
                await fetch(`${API_BASE}/api/cart/items/${target.product.id}?${search.toString()}`, {
                    method: "DELETE",
                    headers: { "x-user-id": session.user.id }
                });
            } catch (e) {
                console.error("Failed to sync cart remove", e);
            }
        }
    };

    const updateQuantity = async (productId: string, quantity: number) => {
        if (quantity < 1) {
            removeItem(productId);
            return;
        }

        const item = items.find(i => i.id === productId);
        if (!item) return;

        const maxQuantity = resolveMaxQuantity(item.product.availableQuantity);
        const clampedQuantity = Math.min(quantity, maxQuantity);

        if (clampedQuantity <= 0) {
            removeItem(productId);
            return;
        }

        setItems((prev) =>
            prev.map((item) =>
                item.id === productId ? { ...item, quantity: clampedQuantity } : item
            )
        );

        if (session?.user) {
            try {
                await fetch(`${API_BASE}/api/cart`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-user-id": session.user.id
                    },
                    body: JSON.stringify({
                        productId: item.product.id,
                        storeId: item.store.id,
                        quantity: clampedQuantity,
                        selectedOptions: item.product.selectedOptions ?? [],
                    })
                });
            } catch (e) {
                console.error("Failed to sync cart update", e);
            }
        }
    };

    const clearCart = async () => {
        setItems([]);
        if (session?.user) {
            try {
                await fetch(`${API_BASE}/api/cart`, {
                    method: "DELETE",
                    headers: { "x-user-id": session.user.id }
                });
            } catch (e) {
                console.error("Failed to sync clear cart", e);
            }
        }
    };

    const clearStoreFromCart = async (storeId: string) => {
        setItems((prev) => prev.filter((item) => item.store.id !== storeId));
        if (session?.user) {
            try {
                await fetch(`${API_BASE}/api/cart?storeId=${storeId}`, {
                    method: "DELETE",
                    headers: { "x-user-id": session.user.id }
                });
            } catch (e) {
                console.error("Failed to sync clear store cart", e);
            }
        }
    };

    const cartTotal = items.reduce(
        (total, item) => total + item.product.price * item.quantity,
        0
    );

    const totalQuantity = items.reduce((count, item) => count + item.quantity, 0);
    const itemCount = items.length;

    const itemsByStore = items.reduce((groups, item) => {
        const storeId = item.store.id;
        if (!groups[storeId]) {
            groups[storeId] = [];
        }
        groups[storeId].push(item);
        return groups;
    }, {} as Record<string, CartItem[]>);

    return (
        <CartContext.Provider
            value={{
                items,
                addItem,
                removeItem,
                updateQuantity,
                clearCart,
                clearStoreFromCart,
                cartTotal,
                itemCount,
                totalQuantity,
                itemsByStore,
                isLoaded,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
}
