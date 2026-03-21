import { ProductGrid } from "./product-grid";

interface Product {
    id: string;
    slug: string;
    name: string;
    price: number;
    originalPrice?: number | null;
    currency: string;
    image: string | null;
    rating: number;
}

interface ProductGridRevealProps {
    products?: Product[];
}

export function ProductGridReveal({ products = [] }: ProductGridRevealProps) {
    return (
        <section className="py-8 md:py-10">
            <div className="mx-auto w-full max-w-6xl px-3 sm:px-6 lg:px-10 xl:px-12 mb-4">
                <h2 className="text-xl sm:text-2xl font-semibold text-neutral-900">More looks</h2>
            </div>
            <ProductGrid products={products} />
        </section>
    );
}
