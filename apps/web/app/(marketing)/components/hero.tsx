"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@shopvendly/ui/components/button";
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
    <section className="bg-background">
      <div className="mx-auto flex min-h-[78vh] max-w-6xl flex-col px-6 pb-8 pt-6 lg:px-12">
        <Header />
        <div className="flex flex-1 items-center justify-center text-center">
          <div className="max-w-3xl py-16">
            <h1 className="mt-4 text-5xl text-black/80 font-semibold">
              The platform your online
              <br /> business runs on.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              Your store. Your payments. Your delivery. One link to share. Free
              to start.
            </p>

            <div className="mt-8 flex items-center gap-4 justify-center">
              <Button
                className="h-11 rounded-md px-10 text-sm font-semibold"
                onClick={handleGetStarted}
                disabled={isPending}
              >
                <span className="flex items-center gap-2">
                  {isPending && (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  )}
                  <span>{isPending ? "Redirecting..." : "Get Started"}</span>
                </span>
              </Button>
            </div>

            <div className="mt-12">
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
        </div>
      </div>
    </section>
  );
}
