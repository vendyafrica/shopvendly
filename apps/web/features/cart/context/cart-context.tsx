"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { useAppSession } from "@/contexts/app-session-context";
import { trackStorefrontEvents } from "@/app/[handle]/lib/storefront-tracking";

const API_BASE = "";

export interface CartItem {
    id: string;
    quantity: number;
    product: {
        id: string;
        name: string;
        price: number;
        currency: string;
        image?: string;
        contentType?: string;
        slug: string;
        availableQuantity?: number;
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
                        const data = await res.json();
                        setItems(data);
                    }
                } catch (e) {
                    console.error("Failed to fetch cart", e);
                }
            } else {
                const stored = localStorage.getItem("vendly_cart");
                if (stored) {
                    try {
                        setItems(JSON.parse(stored));
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
                    const guestRaw = localStorage.getItem("vendly_cart");
                    guestItems = guestRaw ? (JSON.parse(guestRaw) as CartItem[]) : [];
                } catch {
                    guestItems = [];
                }

                // Nothing to merge
                if (!Array.isArray(guestItems) || guestItems.length === 0) {
                    return;
                }

                // Clear guest storage early to prevent any chance of double-merge on re-renders
                localStorage.removeItem("vendly_cart");

                // Fetch server cart
                const serverRes = await fetch(`${API_BASE}/api/cart`, {
                    headers: { "x-user-id": userId }
                });
                const serverItems: CartItem[] = serverRes.ok ? await serverRes.json() : [];

                // Merge by product id; prefer sum of quantities
                const mergedMap = new Map<string, CartItem>();

                for (const item of serverItems) {
                    mergedMap.set(item.id, { ...item });
                }

                for (const item of guestItems) {
                    const existing = mergedMap.get(item.id);
                    if (existing) {
                        mergedMap.set(item.id, {
                            ...existing,
                            quantity: existing.quantity + item.quantity,
                        });
                    } else {
                        mergedMap.set(item.id, { ...item });
                    }
                }

                const mergedItems = Array.from(mergedMap.values());

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
            localStorage.setItem("vendly_cart", JSON.stringify(items));
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

        let nextQuantity = quantity;
        const maxQuantity = newItem.product.availableQuantity ?? Number.POSITIVE_INFINITY;

        // Optimistic update (also computes the exact quantity we should persist)
        setItems((prev) => {
            const existing = prev.find((item) => item.id === newItem.id);
            if (existing) {
                nextQuantity = Math.min(existing.quantity + quantity, maxQuantity);
                return prev.map((item) =>
                    item.id === newItem.id
                        ? { ...item, quantity: nextQuantity }
                        : item
                );
            }
            nextQuantity = Math.min(quantity, maxQuantity);
            return [...prev, { ...newItem, quantity: nextQuantity }];
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
                        quantity: nextQuantity
                    })
                });
            } catch (e) {
                console.error("Failed to sync cart add", e);
            }
        }
    };

    const removeItem = async (productId: string) => {
        setItems((prev) => prev.filter((item) => item.id !== productId));

        if (session?.user) {
            try {
                await fetch(`${API_BASE}/api/cart/items/${productId}`, {
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

        const maxQuantity = item.product.availableQuantity ?? Number.POSITIVE_INFINITY;
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
                        quantity: clampedQuantity
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
