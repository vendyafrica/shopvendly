"use client";

import * as React from "react";
import Image from "next/image";
import { Dialog, DialogContent } from "@shopvendly/ui/components/dialog";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Link01Icon,
} from "@hugeicons/core-free-icons";

type TikTokVideo = {
  id: string;
  title?: string;
  video_description?: string;
  cover_image_url?: string;
  video_url?: string;
  embed_link?: string;
  share_url?: string;
  username?: string;
  created_at?: string;
  hashtags?: string[];
};

interface InspirationGridProps {
  videos: TikTokVideo[];
}

const aspectVariants = [
  "aspect-[3/4]",
  "aspect-[4/5]",
  "aspect-[1/1]",
  "aspect-[4/5]",
  "aspect-[3/4]",
  "aspect-[5/6]",
];

export function InspirationGrid({ videos }: InspirationGridProps) {
  const [playerOpen, setPlayerOpen] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState<number>(0);

  const selectedVideo = playerOpen ? videos[selectedIndex] : null;

  const getEmbedSrc = React.useCallback((video?: TikTokVideo | null) => {
    if (!video?.embed_link) return undefined;
    const hasQuery = video.embed_link.includes("?");
    return `${video.embed_link}${hasQuery ? "&" : "?"}autoplay=1&muted=0`;
  }, []);

  const openVideo = (index: number) => {
    setSelectedIndex(index);
    setPlayerOpen(true);
  };

  const goPrev = () => setSelectedIndex((i) => (i - 1 + videos.length) % videos.length);
  const goNext = () => setSelectedIndex((i) => (i + 1) % videos.length);

  const getHashtags = (video: TikTokVideo): string[] => {
    if (video.hashtags?.length) return video.hashtags;
    const desc = video.video_description || video.title || "";
    const matches = desc.match(/#\w+/g);
    return matches || [];
  };

  const getCaption = (video: TikTokVideo): string => {
    const desc = video.video_description || video.title || "";
    return desc.replace(/#\w+/g, "").trim();
  };

  if (videos.length === 0) {
    return (
      <div className="border bg-card p-4 text-sm text-muted-foreground">
        No inspiration videos available right now.
      </div>
    );
  }

  return (
    <>
      {/* Grid */}
      <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-2 sm:gap-4 lg:gap-5 px-1 sm:px-4 lg:px-6 xl:px-8 [column-fill:balance]">
        {videos.map((video, index) => {
          const label = video.title || video.video_description || `Inspiration ${index + 1}`;
          const aspectClass = aspectVariants[index % aspectVariants.length];
          return (
            <button
              key={video.id}
              type="button"
              className={`group relative mb-3 block w-full break-inside-avoid overflow-hidden rounded-lg bg-muted ${aspectClass} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:mb-4 lg:mb-5`}
              onClick={() => openVideo(index)}
              aria-label={`Play: ${label}`}
            >
              {video.video_url ? (
                <video
                  src={video.video_url}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              ) : video.cover_image_url ? (
                <Image
                  src={video.cover_image_url}
                  alt={label}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 17vw"
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                  No cover
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-11 w-11 rounded-full bg-white/80 backdrop-blur-sm text-black flex items-center justify-center shadow-lg transition-all duration-200 group-hover:scale-110 group-hover:bg-white/95">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-4 w-4 translate-x-px"
                  >
                    <path d="M8 5.14v13.72L19 12 8 5.14Z" />
                  </svg>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Modal */}
      <Dialog open={playerOpen} onOpenChange={(open) => setPlayerOpen(open)}>
        <DialogContent
          className="max-w-none! p-0 overflow-hidden border-0 shadow-2xl"
          showCloseButton={false}
          style={{ width: "min(96vw, 1200px)", maxWidth: "min(96vw, 1200px)", maxHeight: "min(92vh, 800px)", height: "min(92vh, 800px)" }}
        >
          <div className="flex flex-col md:flex-row h-full overflow-hidden" style={{ height: "100%" }}>

            {/* LEFT — video panel, fluid width */}
            <div className="relative flex-1 overflow-hidden bg-black min-h-[40vh] md:min-h-0 flex items-center justify-center">
              {selectedVideo?.video_url ? (
                <video
                  key={selectedVideo.id}
                  src={selectedVideo.video_url}
                  className="w-full h-full max-h-full max-w-full object-contain"
                  controls
                  autoPlay
                  loop
                  muted={false}
                  playsInline
                />
              ) : selectedVideo?.embed_link ? (
                <iframe
                  key={selectedVideo.id}
                  src={getEmbedSrc(selectedVideo)}
                  className="absolute inset-0 w-full h-full"
                  style={{ border: "none" }}
                  allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                  title={selectedVideo.title || selectedVideo.video_description || "TikTok video"}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-white/40 text-sm">
                  No video available.
                </div>
              )}
            </div>

            {/* RIGHT — meta panel, fixed width on desktop */}
            <div
              className="relative flex flex-col shrink-0 min-w-0 bg-white dark:bg-card overflow-y-auto w-full md:w-[350px] lg:w-[400px]"
            >
              {/* Close */}
              <button
                type="button"
                onClick={() => setPlayerOpen(false)}
                className="absolute top-4 right-4 z-10 rounded-full p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition"
                aria-label="Close"
              >
                <HugeiconsIcon icon={Cancel01Icon} className="h-4 w-4" />
              </button>

              <div className="flex flex-col h-full p-6 pr-10">
                {/* Username */}
                {selectedVideo?.username && (
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                    @{selectedVideo.username}
                  </p>
                )}

                {/* Caption */}
                {selectedVideo && getCaption(selectedVideo) && (
                  <p className="text-sm leading-relaxed text-foreground mb-4">
                    {getCaption(selectedVideo)}
                  </p>
                )}

                {/* Hashtags */}
                {selectedVideo && getHashtags(selectedVideo).length > 0 && (
                  <div className="flex flex-wrap gap-x-2 gap-y-1.5 mb-5">
                    {getHashtags(selectedVideo).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs text-muted-foreground hover:text-foreground transition cursor-default"
                      >
                        {tag.startsWith("#") ? tag : `#${tag}`}
                      </span>
                    ))}
                  </div>
                )}

                {/* Timestamp */}
                {selectedVideo?.created_at && (
                  <p className="text-xs text-muted-foreground mb-4">
                    {new Date(selectedVideo.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                )}

                {/* Spacer pushes footer down */}
                <div className="flex-1" />

                {/* Open on TikTok */}
                {(selectedVideo?.share_url || selectedVideo?.embed_link) && (
                  <a
                    href={selectedVideo.share_url || selectedVideo.embed_link || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground underline underline-offset-2 hover:opacity-60 transition mb-5"
                  >
                    <HugeiconsIcon icon={Link01Icon} className="h-3 w-3" />
                    Open on TikTok
                  </a>
                )}

                {/* Prev / Next */}
                {videos.length > 1 && (
                  <div className="flex items-center pt-4 border-t">
                    <button
                      type="button"
                      onClick={goPrev}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition"
                    >
                      <HugeiconsIcon icon={ArrowLeft01Icon} className="h-4 w-4" />
                      Prev
                    </button>

                    <span className="mx-auto text-xs text-muted-foreground tabular-nums">
                      {selectedIndex + 1} / {videos.length}
                    </span>
                    <button
                      type="button"
                      onClick={goNext}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition"
                    >
                      Next
                      <HugeiconsIcon icon={ArrowRight01Icon} className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}