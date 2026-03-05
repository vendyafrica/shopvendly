import { ProductCard } from './product-card';

interface Product {
    id: string;
    slug: string;
    name: string;
    price: number;
    currency: string;
    image: string | null;
    contentType?: string | null;
}

interface ProductGridProps {
    products: Product[];
}

export function ProductGrid({ products }: ProductGridProps) {
    if (products.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">No products available yet.</p>
            </div>
        );
    }

    // Format price for display
    const formatPrice = (amount: number, currency: string) => {
        const showDecimals = currency === "USD";
        return `${currency} ${amount.toLocaleString(undefined, {
            minimumFractionDigits: showDecimals ? 2 : 0,
            maximumFractionDigits: showDecimals ? 2 : 0,
        })}`.trim();
    };

    return (
        <div className="mx-auto w-full max-w-6xl px-3 sm:px-6 lg:px-10 xl:px-12">
            <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-3 sm:gap-5 lg:gap-7 [column-fill:balance]">
                {products.map((product, index) => (
                    <ProductCard
                        key={product.id}
                        index={index}
                        title={product.name}
                        slug={product.slug}
                        price={formatPrice(product.price, product.currency)}
                        image={product.image}
                        contentType={product.contentType}
                    />
                ))}
            </div>
        </div>
    );
}