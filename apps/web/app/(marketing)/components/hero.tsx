"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@shopvendly/ui/components/button";
import { Highlighter } from "@/components/ui/highlighter";
import { Iphone } from "@/components/ui/iphone";
import { Marquee } from "@/components/ui/marquee";
import { Header } from "./header";

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
      <div className="mx-auto max-w-7xl px-6 pb-8 pt-6 lg:px-8">
        <Header />
        <div className="mt-6 overflow-hidden rounded-[2rem] bg-primary/10 px-6 py-12 sm:px-10 lg:px-14 lg:py-16">
          <div className="grid items-center gap-12 lg:min-h-[620px] lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.75fr)]">
            <div className="max-w-2xl">
              <h1 className="text-4xl font-semibold tracking-tight text-black/85 sm:text-5xl lg:text-6xl lg:leading-[1.05]">
                Sell online with
                <br />
                payments and{" "}
                <span className="rounded-md bg-primary/15 px-1.5 py-0.5">
                  <Highlighter
                    action="highlight"
                    color="hsl(var(--primary) / 0.35)"
                    strokeWidth={2}
                    padding={4}
                  >
                    delivery
                  </Highlighter>
                </span>
                <br />
                built for African businesses
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
                Publish products, collect mobile money, track orders, and
                dispatch delivery from one storefront you can share anywhere.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Button
                  variant="outline"
                  className="h-11 rounded-full border-white/70 bg-white px-6 text-sm font-semibold text-foreground shadow-sm hover:bg-white"
                >
                  See demo
                </Button>
                <Button
                  className="h-11 rounded-full px-6 text-sm font-semibold"
                  onClick={handleGetStarted}
                  disabled={isPending}
                >
                  <span className="flex items-center gap-2">
                    {isPending && (
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                    )}
                    <span>{isPending ? "Redirecting..." : "Get started"}</span>
                  </span>
                </Button>
              </div>

              <div className="mt-10">
                <Marquee className="gap-4" pauseOnHover>
                  {heroHighlights.map((item) => (
                    <span
                      key={item}
                      className="mx-3 rounded-full border border-border/70 bg-white px-4 py-2 text-xs font-medium text-foreground/80 shadow-sm"
                    >
                      {item}
                    </span>
                  ))}
                </Marquee>
              </div>
            </div>

            <div className="flex justify-center lg:justify-center">
              <div className="w-full max-w-[250px] sm:max-w-[290px] lg:max-w-[320px]">
                <Iphone
                  src="https://cdn.cosmos.so/ca8ae899-9ce5-40a9-a3d1-da285d32f671?format=jpeg"
                  className="drop-shadow-[0_30px_70px_rgba(15,23,42,0.28)]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
