import type { ReactNode } from "react";
import { Suspense } from "react";
import MarketplaceLayout from "../m/layout";
import { StorefrontHeader, HeaderSkeleton } from "@/modules/storefront/components";
import { storefrontService } from "@/modules/storefront";

const DEFAULT_STORE_LOGO = "/vendly.png";

interface LayoutProps {
  children: ReactNode;
  params: Promise<{ handle: string }>;
}

export default async function StorefrontLayout({ children, params }: LayoutProps) {
  const { handle } = await params;
  const store = await storefrontService.findStoreBySlug(handle);

  const initialStore = store
    ? {
      name: store.name,
      slug: store.slug,
      logoUrl: store.logoUrl ?? DEFAULT_STORE_LOGO,
    }
    : null;

  return (
    <MarketplaceLayout>
      <div className="relative min-h-screen bg-background text-foreground antialiased">
        <Suspense fallback={<HeaderSkeleton />}>
          <StorefrontHeader initialStore={initialStore} />
        </Suspense>
        <main className="flex flex-col w-full">{children}</main>
      </div>
    </MarketplaceLayout>
  );
}