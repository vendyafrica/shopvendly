import { HugeiconsIcon } from "@hugeicons/react";
import {
  ChartUpIcon,
  PaymentSuccess01Icon,
} from "@hugeicons/core-free-icons";
import Link from "next/link";

const features = [
  {
    icon: PaymentSuccess01Icon,
    title: "Accept mobile money. No screenshots.",
    description:
      "MTN and Airtel Money payments, confirmed automatically. Customers pay from your store link — you get notified instantly.",
    image:
      "https://mplsrodasp.ufs.sh/f/9yFN4ZxbAeCYhsFsKgqIygxoXmPQzRMEql94cp6JADvHSYGf",
  },
  {
    icon: ChartUpIcon,
    title: "Know your customers. Bring them back.",
    description:
      "See who buys, what they order, and how often they return. Send targeted offers and campaigns that actually convert.",
    image:
      "https://mplsrodasp.ufs.sh/f/9yFN4ZxbAeCYhsCF1K8IygxoXmPQzRMEql94cp6JADvHSYGf",
  },
] as const;

export function Features() {
  return (
    <section className="bg-[#faf9f7]">
      {features.map((feature, index) => {
        const Icon = feature.icon;

        return (
          <div
            key={feature.title}
            className="relative min-h-svh overflow-hidden bg-neutral-950"
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${feature.image})` }}
            />
            <div className="absolute inset-0 bg-black/50" />

            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_35%)]" />

            <div className={`relative z-10 flex min-h-svh items-end px-6 py-12 sm:px-8 lg:px-12 ${index % 2 === 1 ? 'justify-end text-right' : 'justify-start text-left'}`}>
              <div className="max-w-xl text-white">
                <div className={`flex size-12 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/20 ${index % 2 === 1 ? 'ml-auto' : ''}`}>
                  <HugeiconsIcon icon={Icon} className="size-6 text-white" />
                </div>
                <h2 className="mt-6 text-3xl font-semibold leading-tight sm:text-4xl md:text-5xl">
                  {feature.title}
                </h2>
                <p className="mt-4 text-base leading-7 text-white/85 sm:text-lg">
                  {feature.description}
                </p>
                <div className={`mt-8 flex gap-3 ${index % 2 === 1 ? 'justify-end' : 'justify-start'}`}>
                  <Link href="/account" className="inline-flex h-11 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-black transition-transform duration-150 ease-out hover:bg-white/90 active:scale-[0.97]">
                    Start selling
                  </Link>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}