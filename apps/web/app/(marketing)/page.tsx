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
      <Pricing/>
      <section className="bg-[#faf9f7] px-6 py-20 lg:py-28">
        <div className="mx-auto flex max-w-5xl flex-col items-center rounded-[2rem] bg-primary px-6 py-14 text-center text-primary-foreground sm:px-10 lg:px-16">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary-foreground/80">
            Ready to start?
          </p>
          <h2 className="mt-4 text-3xl font-semibold sm:text-4xl lg:text-5xl">
            Open your store in minutes.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-primary-foreground/85 sm:text-lg">
            One link. Payments and delivery included.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/account" className="inline-flex h-12 items-center justify-center rounded-full bg-white px-8 text-sm font-semibold text-primary transition-colors hover:bg-white/90">
              Start selling
            </Link>
            <Link href="/pricing" className="inline-flex h-12 items-center justify-center rounded-full border border-white/30 px-8 text-sm font-semibold text-primary-foreground transition-colors hover:bg-white/10">
              See pricing
            </Link>
          </div>
        </div>
      </section>
      <FAQs />
    </div>
  );
}
