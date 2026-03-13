import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@shopvendly/ui/components/button";
import { Card } from "@shopvendly/ui/components/card";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkSquareFreeIcons } from "@hugeicons/core-free-icons";

export const metadata: Metadata = {
  title: "ShopVendly Pricing",
  description:
    "See ShopVendly pricing for sellers who want to create an online store for Instagram and TikTok with payments, delivery tools, and marketplace access.",
  alternates: { canonical: "/pricing" },
};

const plan = {
  name: "Pro",
  description: "Everything you need to run your social commerce business.",
  price: "UGX 30,000",
  period: "/month",
  trial: "14-day free trial",
  features: [
    "Unlimited orders",
    "Secure checkout links",
    "Delivery booking and tracking",
    "Instant storefront",
    "Marketplace listing",
    "Sales admin and insights",
  ],
};

export default function PricingPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <section className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-medium text-primary">Pricing</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Simple pricing for social media sellers</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Start free for 14 days. Create your online store, accept payments, manage delivery, and grow with one subscription.
        </p>
      </section>

      <section className="mt-12">
        <Card className="mx-auto max-w-2xl p-8">
          <div>
            <h2 className="text-2xl font-semibold">{plan.name}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
          </div>

          <div className="mt-6">
            <span className="text-4xl font-semibold">{plan.price}</span>
            <span className="text-muted-foreground">{plan.period}</span>
            <p className="mt-2 text-sm font-medium text-primary">{plan.trial}</p>
          </div>

          <ul className="mt-8 space-y-3">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                <HugeiconsIcon icon={CheckmarkSquareFreeIcons} className="mt-0.5 size-4 shrink-0" />
                {feature}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button className="h-11 rounded-full px-6">
              <Link href="/account">Start Free Trial</Link>
            </Button>
            <Button variant="ghost" className="h-11 rounded-full px-6">
              <Link href="/faq">Read FAQs</Link>
            </Button>
          </div>
        </Card>
      </section>
    </main>
  );
}
