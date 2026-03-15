import { Card } from "@shopvendly/ui/components/card";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ChartUpIcon,
  PaymentSuccess01Icon,
  Store01Icon,
} from "@hugeicons/core-free-icons";

const features = [
  {
    icon: Store01Icon,
    title: "Your store, always open.",
    description:
      "Drop one link in your bio. Customers browse, order, and pay — no DMs, no chasing, no missed sales.",
    image:
      "https://mplsrodasp.ufs.sh/f/9yFN4ZxbAeCYLZfYTtpq90aBj2MZ7ruxwhyb3WcSHPCzIkU8",
    align: "left",
  },
  {
    icon: PaymentSuccess01Icon,
    title: "Get paid. Instantly.",
    description:
      "Accept MTN and Airtel Money straight from your storefront. Every payment confirmed, tracked, and tied to the right order.",
    image:
      "https://mplsrodasp.ufs.sh/f/9yFN4ZxbAeCYhsFsKgqIygxoXmPQzRMEql94cp6JADvHSYGf",
    align: "right",
  },
  {
    icon: ChartUpIcon,
    title: "Know what's working.",
    description:
      "See visits, conversions, and top products in one dashboard. Real data so every decision moves your business forward.",
    image:
      "https://mplsrodasp.ufs.sh/f/9yFN4ZxbAeCYhsCF1K8IygxoXmPQzRMEql94cp6JADvHSYGf",
    align: "left",
  },
] as const;

export function Features() {
  return (
    <section className="bg-[#faf9f7]">
      <div className="w-full pt-24">
        <div className="mx-auto mb-14 max-w-7xl px-6 text-left lg:mb-20 lg:px-8">
          <p className="text-primary text-sm font-medium uppercase tracking-[0.18em]">
            Why Vendly
          </p>
          <h2 className="text-foreground mt-3 text-3xl font-semibold md:text-4xl lg:text-5xl">
            Stop selling in DMs. Start running a real business.
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl text-lg">
            One storefront. Mobile money payments. Delivery coordination.
            Everything a social seller needs, without the chaos.
          </p>
        </div>

        <div>
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className="relative flex min-h-svh items-end overflow-hidden bg-neutral-950"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${feature.image})` }}
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/25 to-black/10" />

                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.22),transparent_30%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),transparent_38%,rgba(255,255,255,0.06))]" />

                <div
                  className={`relative z-10 flex min-h-svh w-full items-end px-6 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12 ${
                    feature.align === "right" ? "justify-end" : "justify-start"
                  }`}
                >
                  <Card className="w-full max-w-xl border border-white/20 bg-white/10 p-8 text-white shadow-[0_20px_80px_rgba(15,23,42,0.30)] backdrop-blur-2xl supports-backdrop-filter:bg-white/12 md:p-10">
                    <div className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[linear-gradient(135deg,rgba(255,255,255,0.24),rgba(255,255,255,0.08)_40%,rgba(255,255,255,0.02))]" />
                    <div className="pointer-events-none absolute inset-px rounded-[calc(var(--radius)-1px)] border border-white/10" />

                    <div className="relative z-10 flex size-11 items-center justify-center rounded-full bg-white/16 ring-1 ring-white/20">
                      <HugeiconsIcon icon={Icon} className="size-5 text-white" />

                    </div>

                    <h3 className="relative z-10 mt-6 text-2xl font-semibold text-white md:text-3xl">
                      {feature.title}
                    </h3>

                    <p className="relative z-10 mt-4 text-base leading-7 text-white/82 md:text-lg">
                      {feature.description}
                    </p>
                  </Card>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}