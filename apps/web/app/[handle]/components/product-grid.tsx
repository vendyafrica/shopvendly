import { ProductCard } from './product-card';

interface Product {
    id: string;
    slug: string;
    name: string;
    price: number;
    originalPrice?: number | null;
    discountPercent?: number | null;
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

    const largeScreenColumns = products.length >= 12 ? " lg:columns-4 xl:columns-4" : " lg:columns-3 xl:columns-3";

    return (
        <div className="mx-auto w-full max-w-6xl px-3 sm:px-6 lg:px-10 xl:px-12">
            <div className={`columns-2 sm:columns-2 md:columns-3${largeScreenColumns} gap-3 sm:gap-5 lg:gap-7 [column-fill:balance]`}>
                {products.map((product, index) => (
                    <ProductCard
                        key={product.id}
                        index={index}
                        title={product.name}
                        slug={product.slug}
                        price={formatPrice(product.price, product.currency)}
                        originalPrice={product.originalPrice ? formatPrice(product.originalPrice, product.currency) : null}
                        discountPercent={product.discountPercent ?? null}
                        image={product.image}
                        contentType={product.contentType}
                    />
                ))}
            </div>
        </div>
    );
}