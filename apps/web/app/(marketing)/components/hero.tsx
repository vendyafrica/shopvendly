"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@shopvendly/ui/components/button";
import { Highlighter } from "@/components/ui/highlighter";
import { Iphone } from "@/components/ui/iphone";
import { Marquee } from "@/components/ui/marquee";
import Link from "next/link";

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
    <section className="bg-[#faf9f7]">
      <div className="mx-auto max-w-7xl px-4 pb-8 pt-4 sm:px-6 sm:pb-10 lg:px-8">
        <div className="mt-4 overflow-hidden rounded-[2rem] bg-primary/10 px-4 py-8 sm:mt-6 sm:px-8 sm:py-10 lg:px-14 lg:py-16">
          <div className="flex flex-col gap-10 lg:min-h-[620px] lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.75fr)] lg:items-center lg:gap-12">
            <div className="flex w-full max-w-2xl flex-col">
              <h1 className="text-3xl font-semibold tracking-tight text-black/85 sm:max-w-none sm:text-5xl lg:text-6xl lg:leading-[1.05]">
                Sell online with payments and delivery{" "}
                <span className="hidden sm:inline">
                  <br />
                  built for{" "}
                </span>
                <span className="sm:hidden">built for </span>
                <span className="rounded-md bg-primary/15 px-1.5 py-0.5">
                  <Highlighter
                    action="highlight"
                    color="hsl(var(--primary) / 0.35)"
                    strokeWidth={2}
                    padding={4}
                  >
                    African businesses
                  </Highlighter>
                </span>
              </h1>

              <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:mt-6 sm:text-lg sm:leading-8">
                Publish products, collect mobile money, track orders, and
                dispatch delivery from one storefront you can share anywhere.
              </p>

              <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                <Button
                  variant="outline"
                  className="h-11 w-full rounded-full border-white/70 bg-white px-6 text-sm font-semibold text-foreground shadow-sm hover:bg-white sm:w-auto"
                >
                  <Link
                    href="https://www.shopvendly.store/acemadeit"
                    className="w-full text-center"
                  >
                    See demo
                  </Link>
                </Button>
                <Button
                  className="h-11 w-full rounded-full px-6 text-sm font-semibold sm:w-auto"
                  onClick={handleGetStarted}
                  disabled={isPending}
                >
                  <span className="flex w-full items-center justify-center gap-2 text-center">
                    {isPending && (
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                    )}
                    <span>{isPending ? "Redirecting..." : "Get started"}</span>
                  </span>
                </Button>
              </div>

              <div className="mt-8 hidden overflow-hidden lg:block">
                <Marquee className="gap-3 sm:gap-4" pauseOnHover>
                  {heroHighlights.map((item) => (
                    <span
                      key={item}
                      className="mx-2 rounded-full border border-border/70 bg-white px-3 py-2 text-[11px] font-medium text-foreground/80 shadow-sm sm:mx-3 sm:px-4 sm:text-xs"
                    >
                      {item}
                    </span>
                  ))}
                </Marquee>
              </div>
            </div>

            <div className="flex flex-col items-center gap-6">
              <div className="flex w-full justify-center">
                <Iphone
                  src="https://cdn.cosmos.so/ca8ae899-9ce5-40a9-a3d1-da285d32f671?format=jpeg"
                  className="w-full max-w-[220px] drop-shadow-[0_30px_70px_rgba(15,23,42,0.28)] sm:max-w-[260px] lg:max-w-[320px]"
                />
              </div>

              <div className="w-full overflow-hidden lg:hidden">
                <Marquee className="gap-3" pauseOnHover>
                  {heroHighlights.map((item) => (
                    <span
                      key={item}
                      className="mx-2 rounded-full border border-border/70 bg-white px-3 py-2 text-[11px] font-medium text-foreground/80 shadow-sm"
                    >
                      {item}
                    </span>
                  ))}
                </Marquee>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
