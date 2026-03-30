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
        <div className="mx-auto flex max-w-5xl flex-col items-center rounded-[2rem] bg-primary/90 px-6 py-14 text-center text-primary-foreground sm:px-10 lg:px-16">
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
            <Link
              href="/account"
              className="inline-flex h-12 items-center justify-center rounded-full bg-white px-8 text-sm font-semibold text-primary transition-colors hover:bg-white/90"
            >
              Start selling
            </Link>
            <Link
              href="/pricing"
              className="inline-flex h-12 items-center justify-center rounded-full border border-white/30 px-8 text-sm font-semibold text-primary-foreground transition-colors hover:bg-white/10"
            >
              See pricing
            </Link>
          </div>
        </div>
      </section>
      <Pricing />
      <FAQs />
      <section className="bg-background px-6 py-20 lg:py-28">
        <div className="mx-auto max-w-5xl rounded-[2rem] border border-border/60 bg-white px-6 py-10 shadow-sm sm:px-10 lg:px-14 lg:py-12">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="max-w-xl">
              <h2 className="text-balance text-3xl font-semibold leading-tight text-foreground sm:text-4xl lg:text-5xl">
                Need help getting started?
              </h2>
              <p className="mt-4 max-w-lg text-base leading-7 text-muted-foreground sm:text-lg">
                Message us on WhatsApp and we’ll help you set up your store,
                answer questions, or talk through the best plan for you.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="https://wa.me/256780808992"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Chat on WhatsApp
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex h-11 items-center justify-center rounded-full border border-border/60 bg-white px-5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                >
                  See pricing
                </Link>
              </div>
            </div>

            <div className="rounded-[1.5rem] bg-muted/30 p-6 sm:p-8">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
                Ready to start?
              </p>
              <h3 className="mt-4 text-2xl font-semibold text-foreground sm:text-3xl">
                Open your store in minutes.
              </h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
                One link. Payments and delivery included.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/account"
                  className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Start selling
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex h-11 items-center justify-center rounded-full border border-border/60 bg-white px-5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                >
                  Request a demo
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
