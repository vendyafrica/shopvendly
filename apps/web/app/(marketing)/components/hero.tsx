"use client";

import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@shopvendly/ui/components/badge";
import { Button } from "@shopvendly/ui/components/button";
import { cn } from "@shopvendly/ui/lib/utils";

interface ButtonItem {
  label: string;
  href?: string;
  variant?: "default" | "secondary" | "outline" | "ghost";
}

interface LogoItem {
  name: string;
  logo: string;
  href?: string;
}

interface Hero36Props {
  badge?: {
    label: string;
    variant?: "primary" | "secondary" | "outline";
  };
  heading?: string;
  description?: string;
  buttons?: ButtonItem[];
  trustedBy?: {
    label: string;
    logos: LogoItem[];
  };
  className?: string;
}

export const hero36Demo: Hero36Props = {
  badge: { label: "Social commerce simplified", variant: "outline" },
  heading: "Run your <strong>social commerce business</strong> from one place",
  description:
    "Turn your Instagram or TikTok page into a storefront that helps you manage orders, payments, and delivery without the daily back-and-forth.",
  buttons: [
    { label: "Start free", href: "/account", variant: "default" },
    { label: "View demo", href: "https://vendly.shopvendly.store/", variant: "outline" },
  ],
  trustedBy: {
    label: "Built for modern social sellers",
    logos: [
      {
        name: "Adidas",
        logo: "https://oud.pics/sm/l/adidas.png",
        href: "https://beste.co",
      },
      {
        name: "Puma",
        logo: "https://oud.pics/sm/l/puma.png",
        href: "https://beste.co",
      },
      {
        name: "New Balance",
        logo: "https://oud.pics/sm/l/new-balance.png",
        href: "https://beste.co",
      },
      {
        name: "Converse",
        logo: "https://oud.pics/sm/l/converse.png",
        href: "https://beste.co",
      },
    ],
  },
};

export function Hero(props: Hero36Props = {}) {
  const {
    badge = hero36Demo.badge,
    heading = hero36Demo.heading,
    description = hero36Demo.description,
    buttons = hero36Demo.buttons ?? [],
    trustedBy = hero36Demo.trustedBy,
    className,
  } = props;

  return (
    <section
      className={cn("relative overflow-hidden px-3 pb-16 pt-28 md:pb-24 md:pt-32", className)}
    >
      <div className="absolute inset-x-0 top-0 -z-10 h-144 bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.14),transparent_42%)]" />
      <div className="absolute inset-x-0 top-24 -z-10 mx-auto h-120 max-w-5xl rounded-[2rem] border border-border/40 bg-linear-to-b from-background via-background to-muted/20 shadow-[0_30px_100px_-60px_rgba(124,58,237,0.45)]" />
      <div className="mx-auto max-w-5xl px-4 md:px-6">
        <div className="flex flex-col items-center rounded-[2rem] border border-white/40 bg-background/75 px-6 py-12 text-center shadow-xl shadow-black/5 backdrop-blur-sm sm:px-10 md:px-14 md:py-16">
          {badge && (
            <Badge
              variant={badge.variant ?? "primary"}
              className="mb-6 rounded-full border border-border/60 bg-background px-4 py-1 text-[11px] uppercase tracking-[0.24em] text-muted-foreground"
            >
              {badge.label}
            </Badge>
          )}

          {heading && (
            <h1
              className="max-w-4xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl md:text-6xl [&>strong]:bg-linear-to-r [&>strong]:from-primary [&>strong]:via-primary/80 [&>strong]:to-fuchsia-500 [&>strong]:bg-clip-text [&>strong]:text-transparent [&>strong]:font-semibold"
              dangerouslySetInnerHTML={{ __html: heading }}
            />
          )}

          {description && (
            <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg md:text-xl">
              {description}
            </p>
          )}

          {buttons.length > 0 && (
            <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
              {buttons.map((button, index) => (
                <Button
                  key={index}
                  variant={button.variant ?? "default"}
                  size="lg"
                  className={cn(
                    "h-11 rounded-full px-6",
                    index === 0 && "shadow-lg shadow-primary/20",
                  )}
                >
                  <Link
                    href={button.href ?? "#"}
                    target={button.href?.startsWith("http") ? "_blank" : undefined}
                    rel={button.href?.startsWith("http") ? "noreferrer" : undefined}
                    className="inline-flex items-center gap-2"
                  >
                    {button.label}
                    {index === 0 && <ArrowRight className="size-4" />}
                  </Link>
                </Button>
              ))}
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span>No code setup</span>
            <span className="hidden h-1 w-1 rounded-full bg-border sm:block" />
            <span>Payments in one flow</span>
            <span className="hidden h-1 w-1 rounded-full bg-border sm:block" />
            <span>Delivery workflows included</span>
          </div>

          {trustedBy && (
            <div className="mt-14 w-full border-t border-border/50 pt-8 md:mt-16">
              <p className="mb-6 text-sm text-muted-foreground">
                {trustedBy.label}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
                {trustedBy.logos.map((logo, index) => (
                  <Link
                    key={index}
                    href={logo.href ?? "#"}
                    className="grayscale opacity-50 transition-all hover:grayscale-0 hover:opacity-100"
                  >
                    <Image
                      src={logo.logo}
                      alt={logo.name}
                      width={100}
                      height={32}
                      className="h-8 w-auto object-contain"
                    />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
