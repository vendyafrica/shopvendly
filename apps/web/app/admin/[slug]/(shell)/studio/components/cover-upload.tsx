"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@shopvendly/ui/components/alert";
import { Button } from "@shopvendly/ui/components/button";
import { cn } from "@shopvendly/ui/lib/utils";
import { CloudUpload, TriangleAlert, Upload, XIcon } from "lucide-react";

type LocalFilePreview = {
  file: File;
  previewUrl: string;
  kind: "image" | "video";
};

interface CoverUploadProps {
  maxSize?: number;
  accept?: string;
  className?: string;
  disabled?: boolean;
  onFileSelected?: (file: File | null) => void;
  title?: string;
  description?: string;
}

export function CoverUpload({
  maxSize = 10 * 1024 * 1024,
  accept = "image/*,video/*",
  className,
  disabled,
  onFileSelected,
  title = "Upload cover media",
  description = "Drag and drop an image or video here, or click to browse",
}: CoverUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [selected, setSelected] = useState<LocalFilePreview | null>(null);

  const acceptLabel = useMemo(() => {
    const a = accept.toLowerCase();
    const parts: string[] = [];
    if (a.includes("image")) parts.push("images");
    if (a.includes("video")) parts.push("videos");
    return parts.length ? parts.join(" & ") : "files";
  }, [accept]);

  useEffect(() => {
    return () => {
      if (selected?.previewUrl) URL.revokeObjectURL(selected.previewUrl);
    };
  }, [selected]);

  const openFileDialog = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  const validateFile = (file: File) => {
    const nextErrors: string[] = [];

    if (file.size > maxSize) {
      nextErrors.push(`File is too large. Max size is ${Math.round(maxSize / (1024 * 1024))}MB.`);
    }

    const allowed = accept
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (allowed.length > 0 && !allowed.includes("*/*")) {
      const mimeOk = allowed.some((rule) => {
        if (rule.endsWith("/*")) return file.type.startsWith(rule.slice(0, -1));
        return file.type === rule;
      });

      if (!mimeOk) {
        nextErrors.push(`Unsupported file type: ${file.type || file.name}`);
      }
    }

    return nextErrors;
  };

  const setFile = (file: File | null) => {
    if (selected?.previewUrl) URL.revokeObjectURL(selected.previewUrl);

    if (!file) {
      setSelected(null);
      setErrors([]);
      onFileSelected?.(null);
      return;
    }

    const nextErrors = validateFile(file);
    setErrors(nextErrors);
    if (nextErrors.length > 0) {
      setSelected(null);
      onFileSelected?.(null);
      return;
    }

    const kind: LocalFilePreview["kind"] = file.type.startsWith("video/") ? "video" : "image";
    const previewUrl = URL.createObjectURL(file);
    setSelected({ file, previewUrl, kind });
    onFileSelected?.(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0] ?? null;
    setFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const remove = () => {
    setFile(null);
  };

  const hasSelection = Boolean(selected);

  return (
    <div className={cn("w-full space-y-3", className)}>
      <div
        className={cn(
          "group relative overflow-hidden rounded-xl border transition-all",
          disabled ? "opacity-60 pointer-events-none" : "cursor-pointer",
          isDragging ? "border-dashed border-primary bg-primary/5" : "border-border bg-background"
        )}
        onClick={!hasSelection ? openFileDialog : undefined}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="sr-only"
          disabled={disabled}
        />

        {hasSelection ? (
          <div className="relative aspect-21/9 w-full">
            {selected!.kind === "video" ? (
              <video
                src={selected!.previewUrl}
                className="h-full w-full object-cover"
                controls
                playsInline
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selected!.previewUrl} alt="Cover preview" className="h-full w-full object-cover" />
            )}

            <div className="absolute inset-0 bg-black/0 transition-all duration-200 group-hover:bg-black/40" />

            <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <div className="flex gap-2">
                <Button onClick={openFileDialog} variant="secondary" size="sm">
                  <Upload />
                  Change
                </Button>
                <Button onClick={remove} variant="destructive" size="sm">
                  <XIcon />
                  Remove
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex aspect-21/9 w-full flex-col items-center justify-center gap-3 p-6 text-center">
            <div className="rounded-full bg-primary/10 p-4">
              <CloudUpload className="size-8 text-primary" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
              <p className="text-xs text-muted-foreground">Accepted: {acceptLabel} • Max: {Math.round(maxSize / (1024 * 1024))}MB</p>
            </div>
            <Button variant="outline" size="sm" type="button">
              <Upload />
              Browse
            </Button>
          </div>
        )}
      </div>

      {errors.length > 0 ? (
        <Alert variant="destructive">
          <TriangleAlert className="mt-0.5" />
          <div>
            <AlertTitle>File upload error</AlertTitle>
            <AlertDescription>
              {errors.map((err) => (
                <p key={err}>{err}</p>
              ))}
            </AlertDescription>
          </div>
        </Alert>
      ) : null}
    </div>
  );
}
