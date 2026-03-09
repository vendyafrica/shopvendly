import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkSquareFreeIcons } from "@hugeicons/core-free-icons";
import { Button } from "@shopvendly/ui/components/button";
import { Card, CardContent } from "@shopvendly/ui/components/card";

const plan = {
  name: "All-in-One Plan",
  description: "Everything you need to run your storefront in one simple plan.",
  monthlyPrice: "UGX 30,000",
  annualPrice: "UGX 270,000",
  monthlyLabel: "Billed monthly",
  annualLabel: "Billed yearly",
  savingLabel: "Save 25% on annual billing",
  note: "No hidden fees. Cancel anytime. Setup support included.",
  features: [
    "Unlimited orders",
    "Secure checkout links",
    "Delivery booking and tracking",
    "Instant storefront setup",
    "Marketplace visibility",
    "Sales dashboard and insights",
    "WhatsApp and social selling workflows",
    "Priority support",
  ],
};

export function Pricing() {
  return (
    <section id="pricing" className="bg-background py-24 md:py-28">
      <div className="mx-auto max-w-5xl px-6 text-center">
        <div className="mx-auto max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-muted-foreground">
            One simple plan
          </p>
          <h2 className="mt-4 text-4xl font-semibold tracking-tight md:text-6xl">
            One plan, one price.
          </h2>
          <p className="text-muted-foreground mt-4 text-lg leading-8 md:text-xl">
            Everything you need to run your storefront, collect payments, and
            manage delivery in one affordable package.
          </p>
        </div>

        <div className="mt-10 inline-flex flex-col items-center gap-3">
          <div className="inline-flex rounded-full border border-border/60 bg-muted/40 p-1">
            <button
              type="button"
              className="rounded-full bg-background px-6 py-2 text-sm font-medium shadow-sm"
            >
              Monthly
            </button>
            <button
              type="button"
              className="rounded-full px-6 py-2 text-sm font-medium text-muted-foreground"
            >
              Annually
            </button>
          </div>
          <p className="text-sm text-primary">{plan.savingLabel}</p>
        </div>

        <Card className="mx-auto mt-12 max-w-3xl rounded-[2rem] border-border/60 shadow-[0_24px_80px_-50px_rgba(0,0,0,0.18)]">
          <CardContent className="p-8 md:p-12">
            <div className="mx-auto max-w-xl text-center">
              <h3 className="text-2xl font-semibold tracking-tight">{plan.name}</h3>
              <p className="text-muted-foreground mt-3 text-base leading-7">
                {plan.description}
              </p>

              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:items-end">
                <span className="text-5xl font-semibold tracking-tight md:text-6xl">
                  {plan.monthlyPrice}
                </span>
                <div className="pb-1 text-left">
                  <p className="text-lg font-medium">per month</p>
                  <p className="text-sm text-muted-foreground">{plan.monthlyLabel}</p>
                </div>
              </div>

              <Button className="mt-10 h-12 rounded-xl px-8 shadow-lg shadow-primary/20">
                <Link href="/account">Get Started Now</Link>
              </Button>

              <div className="mt-10 border-t border-dashed border-border/70 pt-8">
                <p className="text-muted-foreground mx-auto max-w-md text-sm leading-7 md:text-base">
                  {plan.note}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mx-auto mt-10 grid max-w-4xl gap-x-10 gap-y-4 text-left sm:grid-cols-2">
          {plan.features.map((feature) => (
            <div key={feature} className="flex items-center gap-3 rounded-xl px-2 py-1">
              <span className="flex size-6 items-center justify-center rounded-full bg-emerald-500/12 text-emerald-600">
                <HugeiconsIcon icon={CheckmarkSquareFreeIcons} className="size-4" />
              </span>
              <span className="text-sm font-medium md:text-base">{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}