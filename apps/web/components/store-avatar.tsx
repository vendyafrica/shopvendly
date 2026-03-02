"use client";

import Image from "next/image";
import { Avatar, AvatarImage, AvatarFallback } from "@shopvendly/ui/components/avatar";

const DEFAULT_STORE_LOGO = "https://mplsrodasp.ufs.sh/f/9yFN4ZxbAeCYDG9RTaEFldC5yAexJX0UPbcvMfWYIpsTjn4G";

function capitalizeFirst(value?: string | null) {
    if (!value) return "Store";
    const trimmed = value.trim();
    if (trimmed.length === 0) return "Store";
    return `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1)}`;
}

interface StoreAvatarProps {
    storeName: string;
    logoUrl?: string | null;
    instagramAvatarUrl?: string | null;
    size?: "sm" | "md" | "lg";
    shape?: "circle" | "square";
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
    shape = "circle",
    className = "",
}: StoreAvatarProps) {
    const avatarUrl = instagramAvatarUrl || logoUrl || DEFAULT_STORE_LOGO;
    const displayName = capitalizeFirst(storeName);

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

    const shapeClasses = {
        circle: {
            root: "",
            media: "",
        },
        square: {
            root: "rounded-md after:rounded-md after:border-0",
            media: "rounded-md",
        },
    } as const;

    return (
        <Avatar className={`${sizeClasses[size]} ${shapeClasses[shape].root} ${className}`}>
            {avatarUrl && (
                <AvatarImage
                    src={avatarUrl}
                    alt={`${displayName} logo`}
                    className={shapeClasses[shape].media}
                />
            )}
            <AvatarFallback className={`bg-neutral-100 text-neutral-700 font-semibold ${shapeClasses[shape].media}`}>
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
    const displayName = capitalizeFirst(storeName);

    return (
        <div
            className={`relative rounded-none overflow-hidden bg-neutral-100 flex items-center justify-center ${className}`}
            style={{ width: size, height: size }}
        >
            {avatarUrl ? (
                <Image
                    src={avatarUrl}
                    alt={`${displayName} logo`}
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
