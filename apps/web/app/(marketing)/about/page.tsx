import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@shopvendly/ui/components/button";

export const metadata: Metadata = {
  title: "About Vendly",
  description:
    "Vendly helps sellers turn social traffic into a real online store. Simple, fast, and built for African commerce.",
  alternates: { canonical: "/about" },
};

const pillars = [
  {
    title: "Built for social sellers",
    description:
      "Vendly helps creators, boutiques, and small businesses turn Instagram and TikTok traffic into a real online store.",
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
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <section className="max-w-3xl space-y-5">
        <p className="text-sm font-medium text-primary">About Vendly</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Online commerce for sellers who grow on social media
        </h1>
        <p className="text-base text-muted-foreground sm:text-lg">
          Vendly is a social commerce platform that helps sellers create online
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
        <h2 className="text-xl font-semibold sm:text-2xl">What sellers use Vendly for</h2>
        <p className="text-muted-foreground">
          Sellers use Vendly to organize products, share storefront links,
          collect orders from social traffic, receive mobile money payments, and
          get discovered through the marketplace.
        </p>
        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap">
          <Button className="h-11 w-full rounded-full px-6 sm:w-auto">
            <Link href="/account">Create Your Store</Link>
          </Button>
          <Button variant="ghost" className="h-11 w-full rounded-full px-6 sm:w-auto">
            <Link href="/pricing">View Pricing</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
