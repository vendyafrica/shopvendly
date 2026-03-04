"use client";

import * as React from "react";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link01Icon } from "@hugeicons/core-free-icons";

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

const aspectClass = "aspect-[9/16]";

export function InspirationGrid({ videos }: InspirationGridProps) {
  React.useEffect(() => {
    console.log('[InspirationGrid] Rendering videos:', videos.map(v => ({
      id: v.id,
      hasVideo: !!v.video_url,
      hasCover: !!v.cover_image_url,
      hasEmbed: !!v.embed_link,
      videoUrl: v.video_url?.substring(0, 50),
      coverUrl: v.cover_image_url?.substring(0, 50),
    })));
  }, [videos]);

  if (videos.length === 0) {
    return (
      <div className="border bg-card p-4 text-sm text-muted-foreground">
        No inspiration videos available right now.
      </div>
    );
  }

  return (
    <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-2 sm:gap-4 lg:gap-5 px-1 sm:px-4 lg:px-6 xl:px-8 [column-fill:balance]">
      {videos.map((video, index) => {
        const label = video.title || video.video_description || `Inspiration ${index + 1}`;
        return (
          <div
            key={video.id}
            className={`group relative mb-3 block w-full break-inside-avoid overflow-hidden rounded-lg bg-muted ${aspectClass} sm:mb-4 lg:mb-5`}
          >
            {video.video_url ? (
              <video
                src={video.video_url}
                poster={video.cover_image_url}
                className="absolute inset-0 w-full h-full object-cover"
                controls
                playsInline
                preload="metadata"
              />
            ) : video.cover_image_url ? (
              <Image
                src={video.cover_image_url}
                alt={label}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 17vw"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-100 dark:bg-neutral-900 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-lg p-4 text-center">
                <HugeiconsIcon icon={Link01Icon} className="h-6 w-6 text-muted-foreground/40 mb-2" />
                <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-tight line-clamp-2">
                  {video.title || video.video_description || "Video Link"}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}