"use client";

import { useEffect, useRef, useState } from "react";

const VIDEO_MIME_MAP: Record<string, string> = {
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".ogg": "video/ogg",
};

function guessMimeType(url: string): string | undefined {
  const clean = url.split("?")[0]?.split("#")[0] ?? url;
  const extIndex = clean.lastIndexOf(".");
  if (extIndex === -1) return undefined;
  const ext = clean.slice(extIndex).toLowerCase();
  return VIDEO_MIME_MAP[ext];
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
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(false);
    console.info("[HeroVideo] mounting", { src, type });

    const videoEl = videoRef.current;
    if (!videoEl) return;

    const onLoaded = () => {
      console.info("[HeroVideo] loadedmetadata", { src, duration: videoEl.duration });
      setIsReady(true);
    };
    const onCanPlay = () => {
      console.info("[HeroVideo] canplay", { src });
      setIsReady(true);
      videoEl.play().catch(() => { });
    };
    const onPlay = () => {
      console.info("[HeroVideo] play", { src });
      setIsReady(true);
    };
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
    <div className="relative h-full w-full bg-neutral-100">
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        className={`${className || ""} transition-opacity duration-700 ${isReady ? "opacity-100" : "opacity-0"}`}
        src={src}
        key={src}
      >
        {type ? <source src={src} type={type} /> : <source src={src} type="video/mp4" />}
      </video>
      {!isReady ? <div className="absolute inset-0 animate-pulse bg-neutral-100" /> : null}
    </div>
  );
}
