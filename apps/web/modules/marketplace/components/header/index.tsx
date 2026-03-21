"use client";

import { Button } from "@shopvendly/ui/components/button";
import { useState, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    Search01Icon,
    MenuIcon,
    Cancel01Icon,
} from "@hugeicons/core-free-icons";
import { signOut } from "@shopvendly/auth/react";
import { useRouter } from "next/navigation";
import { LoginOverlay } from "@/app/(auth)/login/page";
import Search from "../search";
import { useAppSession } from "@/contexts/app-session-context";
import { useCart } from "@/modules/cart/context/cart-context";
import { Portal } from "@/components/portal";
import { Logo, MobileLogo } from "./Logo";
import { WishlistButton } from "./WishlistButton";
import { CartButton } from "./CartButton";
import { UserMenu } from "./UserMenu";
import { MobileMenu } from "./MobileMenu";
import { MobileSearch } from "./MobileSearch";

export default function Header({
    hideSearch = false,
}: {
    hideSearch?: boolean;
}) {
    const { session } = useAppSession();
    const { itemCount } = useCart();
    const isSignedIn = !!session;
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const [showLogin, setShowLogin] = useState(false);
    const [tenantStatus, setTenantStatus] = useState<null | {
        hasTenant: boolean;
        isTenantAdmin?: boolean | null;
        adminStoreSlug?: string | null;
        tenantSlug?: string | null;
    }>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (!isSignedIn) return;

        let cancelled = false;

        const fetchStatus = async () => {
            try {
                const res = await fetch("/api/user/status");
                const data = await res.json();
                if (!cancelled) setTenantStatus(data);
            } catch {
                if (!cancelled) setTenantStatus({ hasTenant: false });
            }
        };

        fetchStatus();

        return () => {
            cancelled = true;
        };
    }, [isSignedIn]);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            if (!isMenuOpen && !isSearchOpen) {
                setIsVisible(!(currentScrollY > lastScrollY && currentScrollY > 100));
            }
            setLastScrollY(currentScrollY);
        };
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, [lastScrollY, isMenuOpen, isSearchOpen]);

    useEffect(() => {
        if (isMenuOpen || isSearchOpen || showLogin) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isMenuOpen, isSearchOpen, showLogin]);

    const handleSellNow = () => router.push("/account");
    const handleSignOut = async () => {
        await signOut();
        router.refresh();
    };

    const isTenantStatusLoading = isSignedIn && tenantStatus === null;
    const isTenant = isSignedIn && !!tenantStatus?.hasTenant;
    const showSellButton = !isSignedIn || (!isTenantStatusLoading && !isTenant);

    return (
        <>
            <header
                className={`sticky top-0 z-40 w-full bg-background/95 backdrop-blur-md transition-transform duration-300 ${isVisible ? "translate-y-0" : "-translate-y-full"
                    }`}
            >
                {/* Desktop Header */}
                <div className="hidden md:block">
                    <div className="mx-auto flex h-20 max-w-7xl items-center gap-8 px-6">
                        {/* Logo */}
                        <Logo />

                        {/* Search */}
                        {!hideSearch && (
                            <div className="flex-1 max-w-3xl">
                                <Search />
                            </div>
                        )}

                        {/* Actions */}
                        <div
                            className={`flex shrink-0 items-center justify-end gap-4 ${hideSearch ? "ml-auto" : ""}`}
                            style={{ minWidth: 220 }}
                        >
                            {/* Wishlist */}
                            <WishlistButton />

                            {/* Cart */}
                            <CartButton itemCount={itemCount} />

                            {/* User Menu */}
                            <UserMenu
                                session={session}
                                tenantStatus={tenantStatus}
                                onShowLogin={() => setShowLogin(true)}
                            />

                            {/* Sell Now Button */}
                            {showSellButton && (
                                <Button
                                    onClick={handleSellNow}
                                    className="bg-primary hover:bg-primary/80 text-white font-medium px-5 py-2.5 h-auto rounded-md active:scale-95 transition-all shadow-sm hover:shadow-md"
                                >
                                    Sell now
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Mobile Header */}
                <div className="md:hidden">
                    <div className="flex items-center justify-between h-16 px-4">
                        {/* Menu Button */}
                        <button
                            aria-label="Toggle menu"
                            className="p-2 -ml-2 rounded-lg hover:bg-muted/70 active:bg-muted active:scale-95 transition-all"
                            onClick={() => {
                                setIsMenuOpen((v) => !v);
                                setIsSearchOpen(false);
                            }}
                        >
                            <HugeiconsIcon
                                icon={isMenuOpen ? Cancel01Icon : MenuIcon}
                                size={22}
                            />
                        </button>

                        {/* Logo */}
                        <MobileLogo />

                        {/* Right Actions */}
                        <div className="flex items-center gap-1">
                            <button
                                aria-label="Search"
                                className="p-2 rounded-lg hover:bg-muted/70 active:bg-muted active:scale-95 transition-all"
                                onClick={() => {
                                    setIsSearchOpen((v) => !v);
                                    setIsMenuOpen(false);
                                }}
                            >
                                <HugeiconsIcon icon={Search01Icon} size={22} />
                            </button>

                            <CartButton itemCount={itemCount} mobile />
                            </div>
                    </div>
                </div>
            </header>

            {/* Mobile Menu */}
            <MobileMenu
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
                session={session}
                showSellButton={showSellButton}
                onSellNow={handleSellNow}
                onShowLogin={() => setShowLogin(true)}
                onSignOut={handleSignOut}
            />

            {/* Mobile Search */}
            <MobileSearch
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                hideSearch={hideSearch}
            />

            {/* Login Overlay */}
            {showLogin && (
                <Portal>
                    <LoginOverlay onClose={() => setShowLogin(false)} />
                </Portal>
            )}
        </>
    );
}

