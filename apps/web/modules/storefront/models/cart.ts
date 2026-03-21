import { Product } from "./product";

export interface SelectedOption {
    name: string;
    value: string;
}

export interface CartProduct extends Partial<Product> {
    id: string;
    slug: string;
    name: string;
    price: number;
    originalPrice?: number | null;
    currency: string;
    image?: string | null | undefined;
    contentType?: string | null | undefined;
    selectedOptions?: SelectedOption[];
}

export interface CartItem {
    id: string;
    product: CartProduct;
    quantity: number;
    store: {
        id: string;
        name: string;
        slug: string;
    };
}
