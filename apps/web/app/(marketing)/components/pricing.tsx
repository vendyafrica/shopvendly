import { Button } from "@shopvendly/ui/components/button";
import { Check } from "lucide-react";
import Link from "next/link";

const proTierFeatures = [
  "Unlimited product listings",
  "Delivery partner integration",
  "WhatsApp order notifications",
  "Customer data and history",
  "Store analytics dashboard",
  "Custom store logo and branding",
  "Instagram product sync",
  "Store policies and refund settings",
  "Priority support",
];

export function Pricing() {
  return (
    <section className="bg-background px-6 py-20 lg:py-28">
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto max-w-2xl space-y-4 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">
            Pricing
          </p>
          <h2 className="text-balance text-3xl font-semibold leading-tight lg:text-5xl">
            Pricing that scales with your business
          </h2>
          <p className="text-muted-foreground mx-auto max-w-xl text-balance text-lg leading-7">
            Choose the perfect plan for your needs and start optimizing your
            workflow today.
          </p>
        </div>

        <div className="mx-auto mt-12 overflow-hidden rounded-[2rem] border border-border/60 bg-white shadow-sm">
          <div className="grid gap-0 md:grid-cols-[1fr_1.2fr]">
            <div className="flex flex-col justify-between p-8 text-center md:border-r md:border-border/60 lg:p-12">
              <div>
                <div className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  Free to start
                </div>
                <h3 className="mt-6 text-2xl font-semibold text-foreground">
                  1-month trial period
                </h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Get your store live, test the flow, and see how Vendly
                  fits your business.
                </p>
              </div>

              <p className="mt-8 text-xs leading-5 text-muted-foreground">
                Includes store setup, payments, and everything you need to
                launch.
              </p>
            </div>

            <div className="p-8 lg:p-12">
              <div className="space-y-5">
                {proTierFeatures.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span className="text-sm leading-6 text-foreground/90">
                      {item}
                    </span>
                  </div>
                ))}
              </div>

              <p className="mt-8 max-w-xl text-sm leading-6 text-muted-foreground">
                Upgrade to Pro when you want more automation, more control, and
                a stronger brand presence.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Button className="h-11 rounded-full px-11 font-bold text-white">
                  <Link href="/account?plan=pro">Start Pro</Link>
                </Button>
                <Link
                  href="/contact"
                  className="text-sm font-medium text-primary underline underline-offset-4"
                >
                  Talk to us on WhatsApp
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
