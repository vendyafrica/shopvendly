"use client";

import { Button } from "@shopvendly/ui/components/button";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight02Icon,
  InstagramIcon,
  Upload02Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";
import Image from "next/image";
import { useOnboarding } from "../context/onboarding-context";
import { getRootUrl, getStorefrontUrl } from "@/utils/misc";

export default function Complete() {
  const { isComplete, completeOnboarding, isLoading, isHydrated, error } = useOnboarding();

  const [isDragging, setIsDragging] = useState(false);
  const [previews, setPreviews] = useState<{ url: string; name: string; file: File }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const didAttemptRef = useRef(false);

  useEffect(() => {
    if (!isHydrated || isComplete || didAttemptRef.current) return;
    didAttemptRef.current = true;
    (async () => { await completeOnboarding(); })();
  }, [isHydrated, isComplete, completeOnboarding]);

  const [tenantSlug, setTenantSlug] = useState<string | null>(null);
  const [storeSlug, setStoreSlug] = useState<string | null>(null);

  useEffect(() => {
    return () => { previews.forEach((p) => URL.revokeObjectURL(p.url)); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isHydrated || typeof window === "undefined") return;
    setTenantSlug(localStorage.getItem("vendly_tenant_slug"));
    setStoreSlug(localStorage.getItem("vendly_store_slug"));
  }, [isHydrated, isComplete]);

  const dashboardSlug = useMemo(() => storeSlug || tenantSlug || "", [storeSlug, tenantSlug]);
  const adminBase = useMemo(() => getRootUrl(dashboardSlug ? `/a/${dashboardSlug}` : "/a"), [dashboardSlug]);

  const storefrontUrl = useMemo(() => (dashboardSlug ? getStorefrontUrl(dashboardSlug) : null), [dashboardSlug]);

  const showLoading = (isLoading || !isHydrated) && !isComplete;
  const hasFiles = previews.length > 0;

  const addFiles = useCallback((files: File[]) => {
    const media = files.filter((f) => f.type.startsWith("image/") || f.type.startsWith("video/"));
    if (media.length === 0) return;
    const newPreviews = media.map((f) => ({ url: URL.createObjectURL(f), name: f.name, file: f }));

    setPreviews((prev) => [...prev, ...newPreviews]);
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(Array.from(e.target.files));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePreview = (index: number) => {
    setPreviews((prev) => {
      const target = prev[index];
      if (target) {
        URL.revokeObjectURL(target.url);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleContinue = async () => {
    // If no files are dropped, we assume they chose the normal "Continue" (which is Instagram logic for the empty state)
    if (!hasFiles) {
      if (!dashboardSlug) return;
      setIsUploading(true);
      try {
        const { linkInstagram } = await import("@shopvendly/auth/client");
        await linkInstagram({
          callbackURL: getRootUrl(`/a/${dashboardSlug}?instagramConnected=true`),
        });
      } catch (err) {
        console.error("Instagram connect failed:", err);
        window.location.href = adminBase;
      } finally {
        setIsUploading(false);
      }
      return;
    }

    // Manual Upload flow
    const tenantId = localStorage.getItem("vendly_tenant_id");
    const storeId = localStorage.getItem("vendly_store_id");

    if (!tenantId || !storeId) {
      window.location.href = getRootUrl(`/a/${dashboardSlug}`);
      return;
    }

    setIsUploading(true);

    try {
      // Create FormData to hit /api/products directly
      const formData = new FormData();
      formData.append("storeId", storeId);
      formData.append("title", "My First Product");
      formData.append("priceAmount", "0");

      // Append files
      previews.forEach((p) => {
        formData.append("files", p.file);
      });

      const res = await fetch("/api/products", {
        method: "POST",
        body: formData, // FormData automatically sets multipart/form-data boundary
      });

      if (!res.ok) {
        throw new Error("Failed to upload product");
      }

      window.location.href = getRootUrl(`/a/${dashboardSlug}`); // land squarely on admin page dashboard
    } catch (err) {
      console.error(err);
      // Even if it fails, drop them into admin dashboard instead of getting stuck
      window.location.href = getRootUrl(`/a/${dashboardSlug}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSkip = () => {
    window.location.href = getRootUrl(`/a/${dashboardSlug}`);
  };

  return (
    <div className="w-full h-[calc(100vh-80px)] max-w-md mx-auto flex flex-col items-center justify-center -mt-6">
      <div className="w-full rounded-2xl border bg-card text-card-foreground shadow-sm p-6 md:p-8 space-y-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Your store is ready!</h1>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Add your first products to start selling.
            </p>
          </div>
        </div>

        {error && !isLoading ? (
          <div className="space-y-3">
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { didAttemptRef.current = false; completeOnboarding(); }}
            >
              Try again
            </Button>
          </div>
        ) : showLoading ? (
          <div className="flex flex-col items-center gap-2 py-2">
            <div className="h-5 w-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Finishing your setup…</p>
          </div>
        ) : (
          <div className="space-y-4 text-left">
            {/* Drop zone */}
            <div
              className={`relative rounded-xl border-2 border-dashed transition-colors cursor-pointer
                ${isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border/70 hover:border-muted-foreground/40 hover:bg-muted/20"
                }
              `}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={handleFileInput}
              />

              {hasFiles ? (
                /* Preview grid */
                <div className="p-3 space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {previews.map((p, i) => (
                      <div
                        key={i}
                        className="relative w-16 h-16 rounded-lg overflow-hidden border border-border/60 shrink-0"
                      >
                        {p.file.type.startsWith("video/") ? (
                          <video
                            src={p.url}
                            className="h-full w-full object-cover"
                            muted
                            loop
                            playsInline
                            autoPlay
                          />
                        ) : (
                          <Image src={p.url} alt={p.name} fill className="object-cover" />
                        )}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removePreview(i); }}
                          className="absolute top-0.5 right-0.5 rounded-full bg-black/60 p-0.5 text-white"
                        >
                          <HugeiconsIcon icon={Cancel01Icon} className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    ))}
                    {/* Add more tile */}
                    <div className="w-16 h-16 rounded-lg border-2 border-dashed border-border/60 flex items-center justify-center text-muted-foreground hover:bg-muted/30 transition-colors shrink-0">
                      <HugeiconsIcon icon={Upload02Icon} className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground px-1">
                    {previews.length} file{previews.length !== 1 ? "s" : ""} selected — click to add more
                  </p>
                </div>
              ) : (
                /* Empty state */
                <div className="flex flex-col items-center gap-2 py-8 px-4 text-center">
                  <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                    <HugeiconsIcon icon={Upload02Icon} className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Upload product photos</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Drag &amp; drop or click to browse
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Instagram / Continue CTA */}
            <Button
              size="lg"
              className="w-full gap-2 transition-all"
              variant={hasFiles ? "default" : "outline"}
              onClick={handleContinue}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  Please wait...
                </>
              ) : hasFiles ? (
                <>
                  Continue
                  <HugeiconsIcon icon={ArrowRight02Icon} className="h-4 w-4" />
                </>
              ) : (
                <>
                  <HugeiconsIcon icon={InstagramIcon} className="h-4 w-4" />
                  Continue with Instagram
                </>
              )}
            </Button>

            <div className="text-center text-xs text-muted-foreground space-y-1">
              <p>
                <button
                  type="button"
                  onClick={handleSkip}
                  className="underline underline-offset-2 hover:text-foreground transition-colors"
                >
                  Skip for now
                </button>
                — you can always add products from your dashboard.
              </p>
              {dashboardSlug ? (
                <p className="flex items-center justify-center gap-2">
                  <a
                    href={getRootUrl(`/a/${dashboardSlug}`)}
                    className="underline underline-offset-2 hover:text-foreground transition-colors"
                  >
                    Go to dashboard
                  </a>
                  {storefrontUrl && (
                    <>
                      <span className="text-border">•</span>
                      <a
                        href={storefrontUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="underline underline-offset-2 hover:text-foreground transition-colors"
                      >
                        View your store
                      </a>
                    </>
                  )}
                </p>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}