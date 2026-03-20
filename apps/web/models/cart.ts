import { z } from "zod";

export const addItemToCartSchema = z.object({
    productId: z.string().uuid(),
    storeId: z.string().uuid(),
    quantity: z.number().int().min(1),
    selectedOptions: z.array(z.object({
        name: z.string(),
        value: z.string(),
    })).optional(),
});

export type CartItemWithRelations = {
    id: string;
    productId: string;
    quantity: number;
    selectedOptions?: Array<{ name?: string; value?: string }> | null;
    product: {
        id: string;
        productName: string;
        priceAmount: number;
        currency: string;
        media?: { media?: { blobUrl?: string | null; contentType?: string | null } | null }[];
        store?: {
            id?: string;
            name?: string;
            slug?: string;
            tenantId?: string;
            logoUrl?: string | null;
        };
    };
};
