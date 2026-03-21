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
    averageRating?: number | null;
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

    const formatPrice = (amount: number, currency: string) => {
        const showDecimals = currency === "USD";
        return `${currency} ${amount.toLocaleString(undefined, {
            minimumFractionDigits: showDecimals ? 2 : 0,
            maximumFractionDigits: showDecimals ? 2 : 0,
        })}`.trim();
    };

    return (
        <div className="mx-auto w-full max-w-6xl px-3 sm:px-6 lg:px-10 xl:px-12">
            <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-5 sm:gap-y-8 md:grid-cols-3 lg:grid-cols-3 lg:gap-x-7 lg:gap-y-10 xl:grid-cols-4">
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
                        averageRating={product.averageRating}
                    />
                ))}
            </div>
        </div>
    );
}