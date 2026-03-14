"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@shopvendly/ui/components/button";

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
    <section className="py-20">
      <div className="relative z-10 mx-auto w-full max-w-2xl px-6 lg:px-0">
        <div className="relative text-center space-y-4">
          <p className="text-muted-foreground text-sm">Sell from Instagram, TikTok, and WhatsApp without the chaos.</p>
          <h1 className="mt-6 text-4xl font-medium">
            Run your online store without juggling apps
          </h1>
          <p className="text-muted-foreground mx-auto mb-6 mt-4 text-balance text-xl">
            ShopVendly gives you one place to run an online store, manage orders, accept payments,
            and handle delivery.
          </p>

          <div className="flex flex-col items-center gap-2 *:w-full sm:flex-row sm:justify-center sm:*:w-auto">
            <Button
              className="px-8 h-11 rounded-md"
              onClick={handleGetStarted}
              disabled={isPending}
              aria-live="polite"
            >
              <span className="flex items-center gap-2">
                {isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
                <span className="text-nowrap">{isPending ? "Redirecting..." : "Create Your Store"}</span>
              </span>
            </Button>
            <Button variant="ghost" className="px-8 h-11 rounded-md">
              <Link href="/pricing">
                <span className="text-nowrap">See Pricing</span>
              </Link>
            </Button>
          </div>
        </div>

        <div className="relative mt-12 overflow-hidden rounded-3xl bg-black/10 md:mt-16">
          <Image
            src="https://images.unsplash.com/photo-1547623641-d2c56c03e2a7?q=80&w=3087&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt=""
            className="absolute inset-0 size-full object-cover"
            width={100}
            height={100}
          />

          <div className="bg-background rounded-lg relative m-4 overflow-hidden border border-transparent shadow-xl shadow-black/15 ring-1 ring-black/10 sm:m-8 md:m-12">
            <video
              className="size-full object-cover"
              src="https://mplsrodasp.ufs.sh/f/9yFN4ZxbAeCYlWrxxrQBAQ3F5fmNoip8XJaL29zWqSOv4EgV"
              autoPlay
              muted
              loop
              playsInline
            />
          </div>
        </div>
      </div>
    </section>
  );
}
