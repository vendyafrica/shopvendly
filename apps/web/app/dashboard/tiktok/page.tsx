"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Button } from "@shopvendly/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@shopvendly/ui/components/dialog";
import { signInWithTikTok } from "@shopvendly/auth/react";

type TikTokProfile = {
  open_id?: string;
  union_id?: string;
  avatar_url?: string;
  display_name?: string;
  bio_description?: string;
  profile_deep_link?: string;
  username?: string;
};

type TikTokVideo = {
  id: string;
  title?: string;
  video_description?: string;
  duration?: number;
  cover_image_url?: string;
  embed_link?: string;
  share_url?: string;
};

const aspectVariants = [
  "aspect-[3/4]",
  "aspect-[4/5]",
  "aspect-[1/1]",
  "aspect-[4/5]",
  "aspect-[3/4]",
  "aspect-[5/6]",
];

const TILE_ASPECT_CLASS = "aspect-[1/1]";

export default function TikTokAuthTestPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
          Loading TikTok integration...
        </div>
      }
    >
      <TikTokAuthTestPageContent />
    </Suspense>
  );
}

function TikTokAuthTestPageContent() {
  const searchParams = useSearchParams();
  const connectedFromCallback = searchParams.get("connected") === "true";

  const [loading, setLoading] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [scopes, setScopes] = useState<string[]>([]);
  const [profile, setProfile] = useState<TikTokProfile | null>(null);
  const [videos, setVideos] = useState<TikTokVideo[]>([]);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<TikTokVideo | null>(null);
  const [selectedAspectClass, setSelectedAspectClass] = useState<string>(aspectVariants[0]);

  const getEmbedSrc = (video?: TikTokVideo | null) => {
    if (!video?.embed_link) return undefined;
    const hasQuery = video.embed_link.includes("?");
    const autoplayParams = "autoplay=1&muted=1";
    return `${video.embed_link}${hasQuery ? "&" : "?"}${autoplayParams}`;
  };

  const loadStatus = useCallback(async () => {
    const res = await fetch("/api/integrations/tiktok/status", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok && res.status !== 401) {
      throw new Error(data?.error || "Failed to check TikTok status");
    }
    setConnected(Boolean(data?.connected));
    setScopes(Array.isArray(data?.scopes) ? data.scopes : []);
    return Boolean(data?.connected);
  }, []);

  const loadProfile = useCallback(async () => {
    const res = await fetch("/api/integrations/tiktok/profile", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || "Failed to fetch TikTok profile");
    }
    setProfile((data?.user ?? null) as TikTokProfile | null);
  }, []);

  const loadRecentVideos = useCallback(async () => {
    const res = await fetch("/api/integrations/tiktok/videos/list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ maxCount: 12 }),
      cache: "no-store",
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || "Failed to fetch TikTok videos");
    }
    setVideos(Array.isArray(data?.videos) ? (data.videos as TikTokVideo[]) : []);
  }, []);

  const loadDisplayData = useCallback(async () => {
    await Promise.all([loadProfile(), loadRecentVideos()]);
  }, [loadProfile, loadRecentVideos]);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        setError(null);
        const isConnected = await loadStatus();
        if (isConnected) {
          await loadDisplayData();
        } else {
          setProfile(null);
          setVideos([]);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load TikTok integration data.");
        }
      } finally {
        if (!cancelled) {
          setIsBootstrapping(false);
        }
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [connectedFromCallback, loadDisplayData, loadStatus]);

  const handleTikTokSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const callbackURL =
        typeof window !== "undefined"
          ? `${window.location.origin}/a/tiktok?connected=true`
          : "/a/tiktok?connected=true";
      const res = await signInWithTikTok({
        callbackURL,
        scopes: ["user.info.basic", "user.info.profile", "video.list"],
      } as { callbackURL: string; scopes: string[] });
      if (res?.error) {
        setError(res.error.message || "Failed to start TikTok login.");
        setLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start TikTok login.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="w-full rounded-xl border bg-white p-6 shadow-sm space-y-4">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold">TikTok Display API Test</h1>
            <p className="text-sm text-muted-foreground">
              Connect TikTok, then preview profile info and your recent videos.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${connected ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
              {connected ? "Connected" : "Not connected"}
            </span>
            {scopes.length > 0 && (
              <span className="text-xs text-muted-foreground">Scopes: {scopes.join(", ")}</span>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="default"
              className="h-11"
              onClick={handleTikTokSignIn}
              disabled={loading}
            >
              {loading ? "Redirecting to TikTok…" : connected ? "Reconnect TikTok" : "Continue with TikTok"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11"
              onClick={() => {
                setError(null);
                setIsBootstrapping(true);
                void (async () => {
                  try {
                    const isConnected = await loadStatus();
                    if (isConnected) {
                      await loadDisplayData();
                    }
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Failed to refresh TikTok data.");
                  } finally {
                    setIsBootstrapping(false);
                  }
                })();
              }}
              disabled={isBootstrapping}
            >
              Refresh
            </Button>
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {profile && (
            <div className="rounded-lg border bg-card p-4 flex items-start gap-3">
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.display_name || profile.username || "TikTok avatar"}
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-full object-cover"
                  sizes="48px"
                />
              ) : (
                <div className="h-12 w-12 rounded-full bg-muted" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold">
                  {profile.display_name || profile.username || "TikTok user"}
                </p>
                {profile.username && (
                  <p className="text-xs text-muted-foreground">@{profile.username}</p>
                )}
                {profile.bio_description && (
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{profile.bio_description}</p>
                )}
                {profile.profile_deep_link && (
                  <a
                    href={profile.profile_deep_link}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-xs font-medium text-foreground underline"
                  >
                    Open TikTok profile
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Recent TikTok Videos</h2>

          {isBootstrapping ? (
            <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
              Loading TikTok data…
            </div>
          ) : videos.length === 0 ? (
            <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
              {connected
                ? "No recent videos found (or missing video.list scope)."
                : "Connect TikTok to load recent videos."}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
              {videos.map((video, index) => {
                const title = video.title || video.video_description || `Video ${index + 1}`;
                const aspectClass = TILE_ASPECT_CLASS;

                return (
                  <button
                    key={video.id}
                    type="button"
                    className="group block text-left"
                    onClick={() => {
                      setSelectedVideo(video);
                      setSelectedAspectClass(aspectClass);
                      setPlayerOpen(true);
                    }}
                  >
                    <div className={`relative overflow-hidden rounded-lg ${aspectClass} bg-muted`}>
                      {video.cover_image_url ? (
                        <Image
                          src={video.cover_image_url}
                          alt={title}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          className="object-cover transition-all duration-700 ease-out group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                          No cover image
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-white/85 text-black/80 flex items-center justify-center shadow-md transition duration-300 group-hover:scale-105">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="h-5 w-5 translate-x-px"
                          >
                            <path d="M8 5.14v13.72L19 12 8 5.14Z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Dialog
        open={playerOpen}
        onOpenChange={(open) => {
          setPlayerOpen(open);
          if (!open) {
            setSelectedVideo(null);
          }
        }}
      >
        <DialogContent className="w-[min(92vw,900px)] p-0 overflow-hidden">
          <DialogHeader className="px-5 pt-5">
            <DialogTitle className="text-sm font-semibold">
              {selectedVideo?.title || selectedVideo?.video_description || "TikTok video"}
            </DialogTitle>
          </DialogHeader>

          <div className="px-5 pb-5">
            <div className={`relative overflow-hidden rounded-lg ${selectedAspectClass} bg-black`}> 
              {selectedVideo?.embed_link ? (
                <iframe
                  key={selectedVideo.id}
                  src={getEmbedSrc(selectedVideo)}
                  className="absolute inset-0 h-full w-full"
                  allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                  title={selectedVideo.title || selectedVideo.video_description || "TikTok video"}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                  Missing embed link.
                </div>
              )}
            </div>

            {(selectedVideo?.share_url || selectedVideo?.embed_link) && (
              <a
                href={selectedVideo.share_url || selectedVideo.embed_link || "#"}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block text-xs font-medium text-foreground underline"
              >
                Open on TikTok
              </a>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
