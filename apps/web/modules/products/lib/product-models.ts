import { z } from "zod";
import {
  PRODUCT_ALPHA_SIZE_PRESET,
  PRODUCT_COLOR_PRESETS,
  PRODUCT_UK_SIZE_PRESET,
} from "@shopvendly/db/schema";
import type { Product, MediaObject } from "@shopvendly/db/schema";

const mediaInputSchema = z.object({
  url: z.string().url(),
  pathname: z.string(),
  contentType: z.string().optional().default("image/jpeg"),
});

const variantOptionSchema = z.object({
  type: z.enum(["color", "size"]),
  label: z.string().min(1).max(32),
  values: z.array(z.string().min(1).max(32)).min(1).max(20),
  preset: z.enum(["alpha", "uk"]).nullable().optional(),
});

const allowedColors = new Set<string>(PRODUCT_COLOR_PRESETS);
const allowedAlphaSizes = new Set<string>(PRODUCT_ALPHA_SIZE_PRESET);
const allowedUkSizes = new Set<string>(PRODUCT_UK_SIZE_PRESET);

export const productVariantsSchema = z
  .object({
    enabled: z.boolean().default(false),
    options: z.array(variantOptionSchema).max(2).default([]),
  })
  .superRefine((value, ctx) => {
    const optionTypes = new Set<string>();
  
    for (const [index, option] of value.options.entries()) {
      if (optionTypes.has(option.type)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate variant option: ${option.type}`,
          path: ["options", index, "type"],
        });
      }
      optionTypes.add(option.type);
    }
  
    if (value.enabled && value.options.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enable at least one variant option when variants are turned on",
        path: ["options"],
      });
    }
  });

function validateOriginalPrice(
  value: { priceAmount?: number; originalPriceAmount?: number | null },
  ctx: z.RefinementCtx
) {
  if (
    typeof value.originalPriceAmount === "number" &&
    typeof value.priceAmount === "number" &&
    value.originalPriceAmount > 0 &&
    value.originalPriceAmount <= value.priceAmount
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Original price must be greater than the current price",
      path: ["originalPriceAmount"],
    });
  }
}

export const createProductSchema = z.object({
  storeId: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  priceAmount: z.number().int().min(0).default(0),
  originalPriceAmount: z.number().int().min(0).nullable().optional(),
  currency: z.string().length(3).optional(),
  quantity: z.number().int().min(0).default(0),
  source: z.enum(["manual", "instagram", "bulk-upload"]).default("manual"),
  sourceId: z.string().optional(),
  sourceUrl: z.string().url().optional(),
  slug: z.string().optional(),
  status: z.enum(["draft", "ready", "active", "sold-out"]).optional(),
  media: z.array(mediaInputSchema).optional(),
  collectionIds: z.array(z.string().uuid()).optional(),
  variants: productVariantsSchema.nullable().optional(),
}).superRefine(validateOriginalPrice);

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type ProductVariantsInput = z.infer<typeof productVariantsSchema>;

export const bulkUploadSchema = z.object({
  storeId: z.string().uuid(),
  defaultCurrency: z.string().length(3).default("UGX"),
  defaultPrice: z.number().int().min(0).default(0),
  generateTitles: z.boolean().default(true),
  markAsFeatured: z.boolean().default(false),
  status: z.enum(["draft", "ready", "active", "sold-out"]).default("draft"),
});

export type BulkUploadInput = z.infer<typeof bulkUploadSchema>;

export interface ProductWithMedia extends Product {
  media: Array<MediaObject & { sortOrder: number; isFeatured: boolean }>;
  collectionIds?: string[];
}

export const productQuerySchema = z.object({
  storeId: z.string().uuid().optional(),
  source: z.enum(["manual", "instagram", "bulk-upload"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
});

export type ProductFilters = z.infer<typeof productQuerySchema>;

export const updateProductSchema = z.object({
  productName: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  priceAmount: z.number().int().min(0).optional(),
  originalPriceAmount: z.number().int().min(0).nullable().optional(),
  currency: z.string().length(3).optional(),
  quantity: z.number().int().min(0).optional(),
  status: z.enum(["draft", "ready", "active", "sold-out"]).optional(),
  media: z.array(mediaInputSchema).optional(),
  collectionIds: z.array(z.string().uuid()).optional(),
  variants: productVariantsSchema.nullable().optional(),
}).superRefine(validateOriginalPrice);

export type UpdateProductInput = z.infer<typeof updateProductSchema>;
