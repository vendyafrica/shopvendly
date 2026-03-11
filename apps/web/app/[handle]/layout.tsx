import type { ReactNode } from "react";
import { Suspense } from "react";
import MarketplaceLayout from "../m/layout";
import { StorefrontHeader } from "./components/header";
import { HeaderSkeleton } from "./components/skeletons";
import { headers } from "next/headers";

const DEFAULT_STORE_LOGO = "/vendly.png";

type StorefrontStore = {
  name: string;
  slug: string;
  logoUrl?: string | null;
};

const getApiBaseUrl = async () => {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") || headerList.get("host");
  const forwardedProto = headerList.get("x-forwarded-proto");
  const isDev = process.env.NODE_ENV === "development";
  const isLocalHost = host ? /^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(host) : false;
  const proto = forwardedProto || (isDev || isLocalHost ? "http" : "https");

  if (host) return `${proto}://${host}`;

  const fallbackUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.WEB_URL;
  if (fallbackUrl) return fallbackUrl.replace(/\/$/, "");

  return isDev ? "http://localhost:3000" : "https://shopvendly.store";
};

interface LayoutProps {
  children: ReactNode;
  params: Promise<{ handle: string }>;
}

export default async function StorefrontLayout({ children, params }: LayoutProps) {
  const { handle } = await params;
  const baseUrl = await getApiBaseUrl();
  const storeRes = await fetch(`${baseUrl}/api/storefront/${handle}`, {
    ...(process.env.NODE_ENV === "development" ? { cache: "no-store" } : { next: { revalidate: 60 } })
  });
  const store = storeRes.ok ? await storeRes.json() as StorefrontStore : null;

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