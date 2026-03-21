"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

interface NavigationOverlayContextValue {
    start: () => void;
    stop: () => void;
}

const NavigationOverlayContext = createContext<NavigationOverlayContextValue | undefined>(undefined);

export function NavigationOverlayProvider({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const [showOverlay, setShowOverlay] = useState(false);
    const startPathRef = useRef<string | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const clearTimer = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const stop = useCallback(() => {
        clearTimer();
        setShowOverlay(false);
        startPathRef.current = null;
    }, [clearTimer]);

    const start = useCallback(() => {
        if (timerRef.current || showOverlay) return;
        startPathRef.current = pathname;
        timerRef.current = setTimeout(() => {
            setShowOverlay(true);
        }, 80);
    }, [pathname, showOverlay]);

    useEffect(() => {
        if (!startPathRef.current) return;
        if (pathname !== startPathRef.current) {
            clearTimer();
            startPathRef.current = null;
            setTimeout(() => setShowOverlay(false), 0);
        }
    }, [pathname, clearTimer]);

    useEffect(() => () => clearTimer(), [clearTimer]);

    const value = useMemo(() => ({ start, stop }), [start, stop]);

    return (
        <NavigationOverlayContext.Provider value={value}>
            {children}
            {showOverlay && (
                <div className="fixed inset-0 z-50 bg-white/70 backdrop-blur-sm flex items-center justify-center">
                    <div className="h-10 w-10 rounded-full border-2 border-neutral-900 border-t-transparent animate-spin" aria-label="Loading" />
                </div>
            )}
        </NavigationOverlayContext.Provider>
    );
}

export function useNavigationOverlay() {
    const ctx = useContext(NavigationOverlayContext);
    if (!ctx) {
        throw new Error("useNavigationOverlay must be used within NavigationOverlayProvider");
    }
    return ctx;
}
