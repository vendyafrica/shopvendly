import { ProductGrid } from "./product-grid";

interface Product {
    id: string;
    slug: string;
    name: string;
    price: number;
    currency: string;
    image: string | null;
    rating: number;
}

interface ProductGridRevealProps {
    products?: Product[];
}

export function ProductGridReveal({ products = [] }: ProductGridRevealProps) {
    return (
        <section>
            <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-5 py-8 md:py-10">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xl sm:text-2xl font-semibold text-neutral-900">More looks</h2>
                </div>
                <ProductGrid products={products} />
            </div>
        </section>
    );
}
