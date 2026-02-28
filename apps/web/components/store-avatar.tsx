"use client";

import Image from "next/image";
import { Avatar, AvatarImage, AvatarFallback } from "@shopvendly/ui/components/avatar";

interface StoreAvatarProps {
    storeName: string;
    logoUrl?: string | null;
    instagramAvatarUrl?: string | null;
    size?: "sm" | "md" | "lg";
    className?: string;
}

/**
 * Standardized store avatar component that displays:
 * - Instagram profile picture if available
 * - Store logo if available
 * - Fallback: Store name initials on off-white background
 */
export function StoreAvatar({
    storeName,
    logoUrl,
    instagramAvatarUrl,
    size = "md",
    className = "",
}: StoreAvatarProps) {
    const DEFAULT_STORE_LOGO = "https://mplsrodasp.ufs.sh/f/9yFN4ZxbAeCYDG9RTaEFldC5yAexJX0UPbcvMfWYIpsTjn4G";
    const avatarUrl = instagramAvatarUrl || logoUrl || DEFAULT_STORE_LOGO;

    // Get initials from store name (up to 2 characters)
    const getInitials = (name: string): string => {
        if (!name) return "S";

        const words = name
            .trim()
            .split(/\s+/)
            .filter((word): word is string => Boolean(word));

        if (words.length === 0) {
            return "S";
        }

        if (words.length === 1) {
            const firstWord = words[0];
            return firstWord ? firstWord.substring(0, 2).toUpperCase() : "S";
        }

        // Take first letter of first two words; guard against missing characters
        const firstTwoInitials = `${words[0]?.[0] ?? ""}${words[1]?.[0] ?? ""}`;
        return firstTwoInitials ? firstTwoInitials.toUpperCase() : "S";
    };

    const initials = getInitials(storeName);

    // Size configurations
    const sizeClasses = {
        sm: "h-6 w-6 text-[10px]",
        md: "h-8 w-8 text-xs",
        lg: "h-12 w-12 text-base",
    };

    return (
        <Avatar className={`${sizeClasses[size]} ${className}`}>
            {avatarUrl && (
                <AvatarImage
                    src={avatarUrl}
                    alt={`${storeName} logo`}
                />
            )}
            <AvatarFallback className="bg-neutral-100 text-neutral-700 font-semibold">
                {initials}
            </AvatarFallback>
        </Avatar>
    );
}

/**
 * Lightweight version for use in tight spaces (like marketplace cards)
 * Uses a simple div instead of Avatar component for better performance
 */
export function StoreAvatarSimple({
    storeName,
    logoUrl,
    instagramAvatarUrl,
    size = 24,
    className = "",
}: {
    storeName: string;
    logoUrl?: string | null;
    instagramAvatarUrl?: string | null;
    size?: number;
    className?: string;
}) {
    const DEFAULT_STORE_LOGO = "/store-logo.jpg";
    const avatarUrl = instagramAvatarUrl || logoUrl || DEFAULT_STORE_LOGO;

    const getInitials = (name: string): string => {
        if (!name) return "S";

        const words = name
            .trim()
            .split(/\s+/)
            .filter((word): word is string => Boolean(word));

        if (words.length === 0) {
            return "S";
        }

        if (words.length === 1) {
            const firstWord = words[0];
            return firstWord ? firstWord.substring(0, 2).toUpperCase() : "S";
        }

        const firstInitial = words[0]?.[0] ?? "";
        const secondInitial = words[1]?.[0] ?? "";
        const combined = `${firstInitial}${secondInitial}`;
        return combined ? combined.toUpperCase() : "S";
    };

    const initials = getInitials(storeName);

    return (
        <div
            className={`relative rounded-full overflow-hidden bg-neutral-100 flex items-center justify-center ${className}`}
            style={{ width: size, height: size }}
        >
            {avatarUrl ? (
                <Image
                    src={avatarUrl}
                    alt={`${storeName} logo`}
                    fill
                    sizes={`${size}px`}
                    className="object-cover"
                    unoptimized={avatarUrl.includes(".ufs.sh")}
                />
            ) : (
                <span
                    className="font-semibold text-neutral-700"
                    style={{ fontSize: size * 0.4 }}
                >
                    {initials}
                </span>
            )}
        </div>
    );
}
