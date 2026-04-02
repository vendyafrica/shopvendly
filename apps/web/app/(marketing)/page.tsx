import type { Metadata } from "next";
import Link from "next/link";
import { FAQs } from "./components/faq";
import { Hero } from "./components/hero";
import { Features } from "./components/features";
import { Pricing } from "./components/pricing";

export const metadata: Metadata = {
  title: "ShopVendly | Simpler commerce for African stores",
  description:
    "The simpler, cheaper way to run an African store online. Sell, get paid, book delivery, and get discovered from one place.",
  alternates: {
    canonical: "/",
  },
};

export default function LandingPage() {
  return (
    <div className="scroll-smooth">
      <Hero />
      <Features />
      <section className="bg-background px-6 py-20 lg:py-28">
        <div className="mx-auto flex max-w-3xl flex-col items-center rounded-[2rem] bg-primary/5 px-6 py-16 text-center sm:px-10 lg:px-16">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
            Ready to start?
          </p>
          <h2 className="mt-4 text-3xl font-bold text-zinc-900 sm:text-4xl lg:text-5xl">
            Open your store in minutes.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-700 sm:text-lg">
            One link. Everything you need to sell online.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/account"
              className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-8 text-sm font-semibold text-white transition-transform duration-150 ease-out hover:bg-primary/90 active:scale-[0.97]"
            >
              Start selling
            </Link>
            <Link
              href="/pricing"
              className="inline-flex h-12 items-center justify-center rounded-md border border-zinc-300 px-8 text-sm font-semibold text-zinc-900 transition-colors hover:bg-black/5"
            >
              See pricing
            </Link>
          </div>
        </div>
      </section>
      <Pricing />
      <FAQs />
    </div>
  );
}
