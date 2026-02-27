import "@shopvendly/ui/globals.css";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Public_Sans } from "next/font/google";
import type { ReactNode } from "react";
import { ThirdParty } from "./third-party";

const publicSans = Public_Sans({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = "https://shopvendly.store";
const vendlyUrl = "https://shopvendly.store";
const defaultTitle = "ShopVendly | Social commerce storefronts & marketplace";
const defaultDescription =
  "Build and shop storefronts from Instagram and TikTok sellers. Onboard in minutes, collect orders, and sell through the ShopVendly marketplace.";
const defaultImage = `${siteUrl}/og-image.png`;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: defaultTitle,
    template: "%s | ShopVendly",
  },
  description: defaultDescription,
  robots: { index: true, follow: true },
  alternates: {
    canonical: siteUrl,
    types: {
      "text/html": vendlyUrl,
    },
  },
  openGraph: {
    title: "ShopVendly | Discover & Shop from social sellers",
    description: defaultDescription,
    url: siteUrl,
    siteName: "ShopVendly",
    images: [
      {
        url: defaultImage,
        width: 1200,
        height: 630,
        alt: "ShopVendly — Marketplace for your favorite social sellers",
      },
    ],
    locale: "en_UG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ShopVendly | Discover & Shop from social sellers",
    description: defaultDescription,
    images: [defaultImage],
    site: "@vendlyafrica",
    creator: "@vendlyafrica",
  },
  other: {
    "geo.region": "UG",
    "geo.placename": "Kampala, Uganda",
    "geo.position": "0.3476;32.5825",
    ICBM: "0.3476, 32.5825",
    "content-language": "en",
  },
};

const jsonLdGraph = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "ShopVendly",
      url: siteUrl,
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/vendly.png`,
        width: 512,
        height: 512,
      },
      description: defaultDescription,
      parentOrganization: {
        "@type": "Organization",
        name: "Vendly Africa",
        url: vendlyUrl,
      },
      areaServed: [
        { "@type": "Country", name: "Uganda" },
        { "@type": "Place", name: "East Africa" },
      ],
      sameAs: [
        "https://www.instagram.com/shopvendly",
        "https://x.com/shopvendly",
        "https://www.linkedin.com/company/shopvendly",
        "https://www.tiktok.com/@shopvendly",
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "ShopVendly",
      publisher: { "@id": `${siteUrl}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${siteUrl}/search?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "WebApplication",
      "@id": `${siteUrl}/#app`,
      name: "ShopVendly Marketplace",
      url: siteUrl,
      applicationCategory: "ShoppingApplication",
      operatingSystem: "Web",
      browserRequirements: "Requires JavaScript",
      creator: { "@id": `${siteUrl}/#organization` },
      featureList: [
        "Pinterest-style visual product browsing",
        "Direct WhatsApp ordering",
        "Independent African brand storefronts",
        "Mobile-first marketplace experience",
        "Category-based store discovery",
        "Secure mobile money payments",
      ],
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        description: "Free to browse and shop",
        availability: "https://schema.org/InStock",
      },
    },
    {
      "@type": "ItemList",
      "@id": `${siteUrl}/#marketplace`,
      name: "African Brands & Stores on ShopVendly",
      description:
        "Browse curated storefronts from African creators, fashion brands, and small businesses.",
      itemListOrder: "https://schema.org/ItemListUnordered",
      numberOfItems: 0,
    },
  ],
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" className={`${publicSans.variable} h-full`}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen h-full bg-background`}
      >
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdGraph) }}
        />
        <ThirdParty />
        {children}
      </body>
    </html>
  );
}

