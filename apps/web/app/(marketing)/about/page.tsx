import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@shopvendly/ui/components/button";

export const metadata: Metadata = {
  title: "About ShopVendly",
  description:
    "Learn how ShopVendly helps Instagram and TikTok sellers create online stores, manage orders, accept payments, and grow their business.",
  alternates: { canonical: "/about" },
};

const pillars = [
  {
    title: "Built for social sellers",
    description:
      "ShopVendly helps creators, boutiques, and small businesses turn Instagram and TikTok traffic into a real online store.",
  },
  {
    title: "Everything in one place",
    description:
      "From storefronts and checkout links to order management and delivery coordination, sellers can run daily operations without juggling multiple tools.",
  },
  {
    title: "Designed for African commerce",
    description:
      "We focus on the realities of mobile-first commerce, including local payments, delivery workflows, and marketplace visibility for growing brands.",
  },
];

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <section className="max-w-3xl space-y-5">
        <p className="text-sm font-medium text-primary">About ShopVendly</p>
        <h1 className="text-4xl font-semibold tracking-tight">
          Online commerce for sellers who grow on social media
        </h1>
        <p className="text-lg text-muted-foreground">
          ShopVendly is a social commerce platform that helps sellers create online
          stores for Instagram and TikTok, manage orders, accept payments, and
          deliver a more professional shopping experience.
        </p>
      </section>

      <section className="mt-12 grid gap-6 md:grid-cols-3">
        {pillars.map((pillar) => (
          <div key={pillar.title} className="rounded-2xl border bg-card p-6">
            <h2 className="text-xl font-semibold">{pillar.title}</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              {pillar.description}
            </p>
          </div>
        ))}
      </section>

      <section className="mt-14 max-w-3xl space-y-4">
        <h2 className="text-2xl font-semibold">What sellers use ShopVendly for</h2>
        <p className="text-muted-foreground">
          Sellers use ShopVendly to organize products, share storefront links,
          collect orders from social traffic, receive mobile money payments, and
          get discovered through the marketplace.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Button className="h-11 rounded-full px-6">
            <Link href="/account">Create Your Store</Link>
          </Button>
          <Button variant="ghost" className="h-11 rounded-full px-6">
            <Link href="/pricing">View Pricing</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
