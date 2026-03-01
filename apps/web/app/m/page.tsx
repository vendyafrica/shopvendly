import Header from "@/features/marketplace/components/header";
import Footer from "@/features/marketplace/components/footer";
import { Button } from "@shopvendly/ui/components/button";
import Link from "next/link";
import { marketplaceService } from "@/features/marketplace/lib/marketplace-service";
import type { MarketplaceStore } from "@/types/marketplace";
import type { StoreWithCategory } from "@/features/marketplace/lib/marketplace-service";
import { HeroSection } from "@/features/marketplace/components/home/hero-section";
import { CollectionsRail } from "@/features/marketplace/components/home/collections-rail";
import { StoreShelf } from "@/features/marketplace/components/home/store-shelf";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

const homeTitle = "ShopVendly Marketplace | Shop Your Favorite Online Stores";
const homeDescription =
  "Discover and shop from African creators, brands, and small sellers. Secure mobile money payments, integrated delivery, and trusted independent stores all in one marketplace.";
const homeImage = "/og-image.png";

export const metadata: Metadata = {
  title: homeTitle,
  description: homeDescription,
  alternates: {
    canonical: "/m",
  },
  openGraph: {
    title: homeTitle,
    description: homeDescription,
    url: "/m",
    siteName: "ShopVendly",
    images: [{ url: homeImage }],
  },
  twitter: {
    card: "summary_large_image",
    title: homeTitle,
    description: homeDescription,
    images: [homeImage],
  },
};

export default async function HomePage() {
  const { categories, stores, storesByCategory } =
    await marketplaceService.getHomePageData();

  const mapToMarketplaceStore = (s: StoreWithCategory): MarketplaceStore => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    description: s.description,
    categories: s.categories || [],
    logoUrl: s.logoUrl ?? null,
    instagramAvatarUrl: s.instagramAvatarUrl ?? null,
    heroMedia: Array.isArray(s.heroMedia) ? s.heroMedia : [],
    images: Array.isArray(s.images) ? s.images : [],
  });

  const uiStores = stores.map(mapToMarketplaceStore);
  const uiStoresByCategory: Record<string, MarketplaceStore[]> = {};

  Object.entries(storesByCategory).forEach(([cat, list]) => {
    uiStoresByCategory[cat] = list.map(mapToMarketplaceStore);
  });

  const sortedCategories = Object.entries(uiStoresByCategory)
    .sort(([, a], [, b]) => b.length - a.length)
    .slice(0, 6);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Header hideSearch />

      <HeroSection />
      <CollectionsRail
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          image: (c as { image?: string | null })?.image ?? null,
        }))}
      />

      {uiStores.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <h3 className="text-2xl font-semibold mb-4">No stores yet</h3>
          <p className="text-muted-foreground mb-8">Be the first to create a store on ShopVendly!</p>
          <Link href="/account">
            <Button size="lg" className="cursor-pointer">Create Your Store</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4 pb-12">
          {sortedCategories.map(([categoryName, categoryStores]) => (
            <StoreShelf
              key={categoryName}
              title={categoryName}
              categorySlug={categoryName.toLowerCase().replace(/\s+/g, "-")}
              stores={categoryStores}
            />
          ))}
        </div>
      )}

      <Footer />
    </main>
  );
}
