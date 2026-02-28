import Header from "@/features/marketplace/components/header";
import Footer from "@/features/marketplace/components/footer";
import { MarketplaceGrid } from "@/features/marketplace/components/marketplace-grid";
import { CollectionsRail } from "@/features/marketplace/components/home/collections-rail";
import type { MarketplaceStore } from "@/types/marketplace";
import Link from "next/link";
import type { Metadata } from "next";
import { marketplaceService } from "@/features/marketplace/lib/marketplace-service";
import { notFound } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeftIcon } from "@hugeicons/core-free-icons";

interface CategoryPageProps {
    params: Promise<{
        category: string;
    }>;
}

const formatCategoryName = (slug: string) =>
    slug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
    const { category: categorySlug } = await params;
    const categoryName = formatCategoryName(categorySlug);
    const ogImage = "/og-image.png";

    const title = `${categoryName} | Shop ${categoryName} on ShopVendly`;
    const description = `Discover ${categoryName} stores and products. Browse curated selections and shop ${categoryName.toLowerCase()} on ShopVendly.`;

    return {
        title,
        description,
        alternates: {
            canonical: `/category/${categorySlug}`,
        },
        openGraph: {
            title,
            description,
            url: `/category/${categorySlug}`,
            siteName: "ShopVendly",
            images: [{ url: ogImage }],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: [ogImage],
        },
    };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
    const { category: categorySlug } = await params;
    const [stores, subcategories] = await Promise.all([
        marketplaceService.getStoresBySpecificCategory(categorySlug),
        marketplaceService.getSubcategoriesByParentSlug(categorySlug),
    ]);

    if (!subcategories) {
        notFound();
    }

    const uiStores: MarketplaceStore[] = stores.map(store => ({
        id: store.id,
        name: store.name,
        slug: store.slug,
        description: store.description,
        categories: store.categories || [],
        rating: 4.5,
        logoUrl: store.logoUrl ?? null,
        images: store.images ?? [],
    }));

    const categoryName = formatCategoryName(categorySlug);

    return (
        <main className="min-h-screen bg-background text-foreground">
            <Header />

            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
                <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                    <div className="space-y-2">
                        <h1 className="text-lg md:text-xl font-medium tracking-tight">{categoryName}</h1>
                    </div>

                    <Link href="/" className="shrink-0 text-foreground hover:text-foreground/80">
                        <span className="flex items-center gap-2">
                            <HugeiconsIcon icon={ArrowLeftIcon} size={18} />
                            Back
                        </span>
                    </Link>
                </div>
            </section>

            {subcategories.length > 0 ? (
                <CollectionsRail
                    title="Sub-categories"
                    categories={subcategories.map((subcategory) => ({
                        id: subcategory.id,
                        name: subcategory.name,
                        slug: subcategory.slug,
                        image: subcategory.image,
                    }))}
                />
            ) : null}

            {uiStores.length > 0 ? (
                <MarketplaceGrid stores={uiStores} loading={false} />
            ) : (
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                    <p className="text-sm text-muted-foreground">No stores in this category yet.</p>
                </section>
            )}

            <Footer />
        </main>
    );
}
