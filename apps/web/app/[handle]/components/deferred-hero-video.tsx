"use client";

import { useEffect, useRef } from "react";

const VIDEO_MIME_MAP: Record<string, string> = {
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".ogg": "video/ogg",
};

function guessMimeType(url: string) {
  const clean = url.split("?")[0]?.split("#")[0] ?? url;
  const ext = clean.slice(clean.lastIndexOf("."));
  return VIDEO_MIME_MAP[ext.toLowerCase()] || "video/mp4";
}

export function DeferredHeroVideo({
  src,
  className,
}: {
  src: string;
  className?: string;
}) {
  const type = guessMimeType(src);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    console.info("[HeroVideo] mounting", { src, type });

    const videoEl = videoRef.current;
    if (!videoEl) return;

    const onLoaded = () => console.info("[HeroVideo] loadedmetadata", { src, duration: videoEl.duration });
    const onCanPlay = () => console.info("[HeroVideo] canplay", { src });
    const onPlay = () => console.info("[HeroVideo] play", { src });
    const onError = () => console.error("[HeroVideo] error", { src, error: videoEl.error });

    videoEl.addEventListener("loadedmetadata", onLoaded);
    videoEl.addEventListener("canplay", onCanPlay);
    videoEl.addEventListener("play", onPlay);
    videoEl.addEventListener("error", onError);

    return () => {
      videoEl.removeEventListener("loadedmetadata", onLoaded);
      videoEl.removeEventListener("canplay", onCanPlay);
      videoEl.removeEventListener("play", onPlay);
      videoEl.removeEventListener("error", onError);
    };
  }, [src, type]);

  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      className={className}
      src={src}
      // Adding a key forces React to replace the node if the src changes
      key={src}
    >
      <source src={src} type={type} />
    </video>
  );
}
