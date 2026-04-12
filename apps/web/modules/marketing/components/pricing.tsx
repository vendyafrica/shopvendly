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
          <h2 className="text-balance text-4xl font-bold leading-tight lg:text-5xl">
            Simple, transparent pricing
          </h2>
          <p className="text-muted-foreground mx-auto max-w-xl text-balance text-base leading-7">
            Start free for 30 days. Upgrade when you&apos;re ready. No hidden fees.
          </p>
        </div>

        <div className="mx-auto mt-12 overflow-hidden rounded-[2rem] border border-border/60 bg-white shadow-sm">
          <div className="grid gap-0 md:grid-cols-[1fr_1.2fr]">
            <div className="flex flex-col justify-between bg-gradient-to-b from-gray-50 to-transparent p-8 text-center md:border-r md:border-border/60 lg:p-12">
              <div>
                <div className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  Free to start
                </div>
                <h3 className="mt-6 text-2xl font-bold text-foreground">
                  30-day free trial
                </h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Get your store live, test everything, and see if Vendly works for your business.
                </p>
              </div>

              <p className="mt-8 text-xs leading-5 text-muted-foreground">
                Includes store setup, payments, and everything you need to launch.
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

              <p className="mt-8 text-sm leading-6 text-muted-foreground">
                Upgrade to Pro anytime for advanced automation, full control, and premium support.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/account?plan=pro"
                  className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-semibold text-white transition-transform duration-150 ease-out hover:bg-primary/90 active:scale-[0.97]"
                >
                  Start Pro
                </Link>
                <Link
                  href="https://wa.me/256780808992"
                  className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  Chat on WhatsApp →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
