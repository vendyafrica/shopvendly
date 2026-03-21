import { Suspense } from "react";
import { Hero } from "./hero";
import { StorefrontContentSwitcher } from "./storefront-content-switcher.client";
import { StorefrontFooter } from "./footer";
import { StorefrontViewTracker } from "./storefront-view-tracker";
import { OneTapLogin } from "@/modules/marketplace/components/one-tap-login";
import { StoreDetails, StorefrontProduct, StoreCollection } from "@/app/[handle]/models/store";

interface StorefrontUIProps {
    handle: string;
    store: StoreDetails;
    products: StorefrontProduct[];
    collections: StoreCollection[];
    activeCollectionSlug?: string;
    activeSection?: string;
    hasSaleTab: boolean;
    initialQuery?: string;
}

export function StorefrontUI({
    handle,
    store,
    products,
    collections,
    activeCollectionSlug,
    activeSection,
    hasSaleTab,
    initialQuery,
}: StorefrontUIProps) {
    return (
        <div className="min-h-screen">
            {/* Async trackers — fire and forget, don't block render */}
            <Suspense fallback={null}>
                <StorefrontViewTracker storeSlug={handle} />
            </Suspense>
            <Suspense fallback={null}>
                <OneTapLogin storeSlug={handle} />
            </Suspense>

            <Hero store={store} />

            <StorefrontContentSwitcher
                handle={handle}
                collections={collections}
                activeCollectionSlug={activeCollectionSlug}
                activeSection={activeSection}
                hasSaleTab={hasSaleTab}
                initialQuery={initialQuery}
                products={products}
            />

            <StorefrontFooter store={store} />
        </div>
    );
}
