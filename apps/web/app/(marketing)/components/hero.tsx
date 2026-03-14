"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@shopvendly/ui/components/button";

const navItems = [
  { label: "About", href: "/about" },
  { label: "Pricing", href: "/pricing" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
  { label: "Marketplace", href: "/m" },
];

const heroHighlights = [
  "Local mobile-money payments",
  "Delivery booking",
  "Marketplace discovery",
  "Affordable storefront",
  "Inventory & order tracking",
];

export function Hero() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleGetStarted = () => {
    if (isPending) return;

    startTransition(() => {
      router.push("/account");
    });
  };

  return (
    <section className="bg-background">
      <div className="mx-auto flex min-h-[90vh] max-w-6xl flex-col px-6 pb-16 pt-8 lg:px-12">
        <header className="flex items-center justify-between gap-6">
          <Link
            href="/"
            className="flex items-center text-3xl font-black tracking-tight text-foreground"
          >
            <span>sh</span>
            <span className="text-primary">o</span>
            <span>pvend</span>
            <span className="text-primary">ly</span>
          </Link>
          <nav className="hidden items-center gap-8 text-[11px] font-medium tracking-[0.16em] text-foreground/70 lg:flex">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="transition hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/account"
              className="hidden text-xs font-medium  tracking-[0.14em] text-foreground/80 transition hover:text-foreground sm:inline-flex"
            >
              Sign In
            </Link>
          </div>
        </header>

        <div className="flex flex-1 items-center justify-center text-center">
          <div className="max-w-3xl py-16">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/80">
              Shopify for African stores
            </p>
            <h1 className="mt-4 text-5xl font-semibold tracking-tight text-foreground sm:text-6xl">
              Solving your store management problems, one solution at a time.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              Simplify orders, payments, delivery, and marketplace discovery in one dashboard that is
              cheaper and built for local workflows.
            </p>

            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button
                className="h-12 rounded-full px-8 text-sm font-semibold"
                onClick={handleGetStarted}
                disabled={isPending}
              >
                <span className="flex items-center gap-2">
                  {isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
                  <span>{isPending ? "Redirecting..." : "Get Started"}</span>
                </span>
              </Button>
              <Button variant="outline" className="h-12 rounded-full px-8">
                <Link href="/pricing">See Pricing</Link>
              </Button>
            </div>

            <div className="mt-12 flex flex-wrap justify-center gap-3">
              {heroHighlights.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-border/70 bg-white px-4 py-2 text-xs font-medium text-foreground/80 shadow-sm"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
