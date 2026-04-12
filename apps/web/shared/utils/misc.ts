import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

type MediaHint = {
    url?: string | null;
    contentType?: string | null;
};

const VIDEO_EXTENSION_REGEX = /\.(mp4|webm|mov|ogg)(?:$|[?#])/i;
const IMAGE_EXTENSION_REGEX = /\.(jpg|jpeg|png|webp|gif|avif|svg)(?:$|[?#])/i;

export function isLikelyVideoMedia({ url, contentType }: MediaHint) {
    const normalizedContentType = contentType?.toLowerCase() ?? null;
    if (normalizedContentType?.startsWith("video/")) return true;

    if (!url) return false;

    try {
        const parsed = new URL(url);
        const pathname = parsed.pathname.toLowerCase();
        const hintedFileType = parsed.searchParams.get("x-ut-file-type") || parsed.searchParams.get("file-type");

        if (hintedFileType?.toLowerCase().startsWith("video")) return true;
        if (VIDEO_EXTENSION_REGEX.test(pathname)) return true;

        const isUploadThingUrl = parsed.hostname.endsWith(".ufs.sh") || parsed.hostname === "utfs.io";
        const looksLikeImage = IMAGE_EXTENSION_REGEX.test(pathname);

        if (isUploadThingUrl && !looksLikeImage && !normalizedContentType?.startsWith("image/")) {
            return true;
        }

        return false;
    } catch {
        return VIDEO_EXTENSION_REGEX.test(url);
    }
}

// from storefront.ts
export function getStorefrontUrl(storeSlug: string, path: string = "") {
    const isLocalhost = process.env.NODE_ENV === "development";
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "shopvendly.store";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");

    const formattedPath = path && !path.startsWith("/") ? `/${path}` : path;

    if (typeof window !== "undefined") {
        const origin = window.location.origin.replace(/\/$/, "");
        return `${origin}/${storeSlug}${formattedPath}`;
    }

    if (appUrl) {
        return `${appUrl}/${storeSlug}${formattedPath}`;
    }

    if (isLocalhost) {
        return `http://localhost:3000/${storeSlug}${formattedPath}`;
    }

    const normalizedRootDomain = rootDomain
        .trim()
        .replace(/^https?:\/\//i, "")
        .replace(/\/$/, "")
        .replace(/^www\./i, "");

    return `https://${storeSlug}.${normalizedRootDomain}${formattedPath}`;
}

export function getRootUrl(path: string = "") {
    const isLocalhost = process.env.NODE_ENV === "development";
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "shopvendly.store";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    const formattedPath = path && !path.startsWith("/") ? `/${path}` : path;

    if (typeof window !== "undefined") {
        return `${window.location.origin}${formattedPath}`;
    }

    if (appUrl) {
        const normalizedAppUrl = appUrl.trim().replace(/\/$/, "");
        return `${normalizedAppUrl}${formattedPath}`;
    }

    if (isLocalhost) {
        return `http://localhost:3000${formattedPath}`;
    }

    const normalizedRoot = rootDomain.trim().replace(/\/$/, "");
    const withProtocol = /^https?:\/\//i.test(normalizedRoot)
        ? normalizedRoot
        : `https://${normalizedRoot}`;
    const secureOrigin = withProtocol.replace(/^http:\/\//i, "https://");

    return `${secureOrigin}${formattedPath}`;
}

export function getStorefrontRelativePath(path: string = "") {
    return path && !path.startsWith("/") ? `/${path}` : (path || "/");
}
