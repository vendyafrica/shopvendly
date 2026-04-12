import { z } from "zod";

export const instagramImportSchema = z.object({
  storeId: z.string().uuid(),
});

export const instagramSyncSchema = z.object({
  storeId: z.string().uuid(),
  limit: z.number().int().min(1).max(50).optional(),
});

export type InstagramMediaChild = {
  id: string | number;
  media_type?: string | null;
  media_url?: string | null;
  thumbnail_url?: string | null;
};

export type InstagramMediaItem = {
  id: string | number;
  caption?: string | null;
  media_type?: string | null;
  media_url?: string | null;
  thumbnail_url?: string | null;
  permalink?: string | null;
  children?: { data?: InstagramMediaChild[] | null } | null;
};
