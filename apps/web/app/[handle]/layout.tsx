import type { ReactNode } from "react";
import MarketplaceLayout from "../(m)/layout";
import { StorefrontHeader } from "./components/header";
import { NavigationOverlayProvider } from "./components/navigation-overlay";
import { headers } from "next/headers";

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
  params: Promise<{ s: string }>;
}

export default async function StorefrontLayout({ children, params }: LayoutProps) {
  const { s } = await params;
  const baseUrl = await getApiBaseUrl();
  const storeRes = await fetch(`${baseUrl}/api/storefront/${s}`, { next: { revalidate: 60 } });
  const store = storeRes.ok ? await storeRes.json() as StorefrontStore : null;

  const initialStore = store
    ? {
        name: store.name,
        slug: store.slug,
        logoUrl: store.logoUrl ?? undefined,
      }
    : null;

  return (
    <MarketplaceLayout>
      <NavigationOverlayProvider>
        <div className="relative min-h-screen bg-background text-foreground antialiased">
          <StorefrontHeader initialStore={initialStore} />
          <main className="flex flex-col w-full">{children}</main>
        </div>
      </NavigationOverlayProvider>
    </MarketplaceLayout>
  );
}