import { Suspense } from "react";
import { ProductDetails } from "./product-details";
import { ProductGridReveal } from "./product-grid-reveal";
import { StorefrontFooter } from "./footer";

interface ProductPageUIProps {
    productWithStore: any;
    products: any[];
    store: any;
    storeCategories: any[];
    productJsonLd: any;
    breadcrumbJsonLd: any;
}

export function ProductPageUI({
    productWithStore,
    products,
    store,
    storeCategories,
    productJsonLd,
    breadcrumbJsonLd,
}: ProductPageUIProps) {
    return (
        <main className="bg-white min-h-screen">
            <script
                type="application/ld+json"
                suppressHydrationWarning
                dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
            />
            <script
                type="application/ld+json"
                suppressHydrationWarning
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
            />
            <Suspense
                fallback={
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-26 pb-8 md:pt-30 md:pb-12">
                        <div className="h-[70vh] rounded-md bg-neutral-100 animate-pulse" />
                    </div>
                }
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-26 pb-8 md:pt-30 md:pb-12">
                    <ProductDetails
                        product={productWithStore}
                        storeCategories={storeCategories}
                        storePolicy={store.storePolicy ?? null}
                    />
                </div>
            </Suspense>
            <ProductGridReveal products={products.map((p) => ({ ...p, rating: p.averageRating ?? 0 }))} />
            <StorefrontFooter store={store} />
        </main>
    );
}
