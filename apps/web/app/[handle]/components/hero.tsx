import Image from "next/image";

import { DeferredHeroVideo } from "./deferred-hero-video";
import { HeroScrollCta } from "./hero-scroll-cta.client";

interface HeroProps {
  store: {
    name: string;
    description: string | null;
    slug?: string;
    logoUrl?: string | null;
    heroMedia?: string[];
  };
}

const FALLBACK_HERO_MEDIA =
  "https://utfs.io/f/9yFN4ZxbAeCYIjymxUcYrfE9oTGDCn7j61SeOdhpKX3IUkQq";
const VIDEO_EXTENSIONS = [".mp4", ".webm", ".ogg", ".mov"];
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif", ".svg"];

function isUploadThingBlobUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.endsWith(".ufs.sh") || parsed.hostname === "utfs.io";
  } catch {
    return /(?:\.ufs\.sh|utfs\.io)/i.test(url);
  }
}

function hasLikelyImageExtension(url: string) {
  const cleanUrl = url.split("?")[0]?.split("#")[0] ?? url;
  const lower = cleanUrl.toLowerCase();
  return IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function isVideoUrl(url: string) {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname.toLowerCase();

    const typeParam =
      parsed.searchParams.get("x-ut-file-type") ||
      parsed.searchParams.get("file-type");
    if (typeParam && typeParam.toLowerCase().startsWith("video")) return true;

    const hasVideoExt = VIDEO_EXTENSIONS.some((ext) => pathname.endsWith(ext));
    if (hasVideoExt) return true;

    return false;
  } catch {
    const cleanUrl = url.split("?")[0]?.split("#")[0] ?? url;
    const lower = cleanUrl.toLowerCase();
    const hasVideoExt = VIDEO_EXTENSIONS.some((ext) => lower.endsWith(ext));
    if (hasVideoExt) return true;

    return false;
  }
}

export function Hero({ store }: HeroProps) {
  const heroMedia = Array.isArray(store.heroMedia) ? store.heroMedia : [];
  const mediaUrl = heroMedia[0] || FALLBACK_HERO_MEDIA;
  const isUploadThing = typeof mediaUrl === "string" && isUploadThingBlobUrl(mediaUrl);
  const looksLikeImage = typeof mediaUrl === "string" && hasLikelyImageExtension(mediaUrl);

  const isVideo =
    typeof mediaUrl === "string" &&
    (isVideoUrl(mediaUrl) || (isUploadThing && !looksLikeImage));

  const shouldUseNativeImg =
    typeof mediaUrl === "string" && isUploadThing && looksLikeImage;
  const fallbackPoster = store.logoUrl || "/og-image.png";

  const heroDescription =
    store.description ||
    "Discover elevated basics, sculpted silhouettes, and effortless ease.";

  return (
    <section className="relative min-h-[80vh] sm:min-h-[90vh] w-full overflow-hidden bg-[#f2f2f2]">
      {/* Background media */}
      <div className="absolute inset-0 z-0">
        {isVideo ? (
          <DeferredHeroVideo
            src={mediaUrl}
            className="w-full h-full object-cover"
            fallbackPoster={fallbackPoster}
          />
        ) : (
          shouldUseNativeImg ? (
            <Image
              src={mediaUrl}
              alt={`${store.name} hero`}
              fill
              priority
              className="object-cover bg-neutral-100"
              sizes="100vw"
              unoptimized
            />
          ) : (
            <Image
              src={mediaUrl}
              alt={`${store.name} hero`}
              fill
              priority
              className="object-cover bg-neutral-100"
              sizes="100vw"
              unoptimized={isUploadThingBlobUrl(mediaUrl)}
            />
          )
        )}
        <div className="absolute inset-0 z-10 bg-linear-to-b from-black/30 via-black/10 to-transparent" aria-hidden />
      </div>

      <div className="relative z-20 max-w-[1200px] mx-auto px-4 sm:px-6 md:px-10 pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-16 md:pb-20">
        <div className="min-h-[60vh] sm:min-h-[70vh] flex items-end justify-end">
          <div className="flex flex-col gap-6 sm:gap-8 pb-6 sm:pb-8 text-right max-w-lg">
            <p className="text-sm sm:text-base text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.35)] leading-relaxed">
              {heroDescription}
            </p>
            <div className="flex w-full sm:w-auto justify-end">
              <HeroScrollCta
                targetId="storefront-main-content"
                className="px-6 sm:px-8 h-11 bg-white text-neutral-900 text-sm font-semibold tracking-wide rounded-full shadow-md hover:bg-white/90"
              >
                Shop Now
              </HeroScrollCta>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}
