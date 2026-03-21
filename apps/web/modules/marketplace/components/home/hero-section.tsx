"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@shopvendly/ui/components/button";
import { Input } from "@shopvendly/ui/components/input";
import { useMemo, useState, useEffect } from "react";
import dynamic from "next/dynamic";

import { Bricolage_Grotesque } from "next/font/google";

const geistSans = Bricolage_Grotesque({
  variable: "--font-bricolage-grotesque",
  subsets: ["latin"],
});

import { heroCopy, type HeroMode } from "@/lib/constants/hero-copy";

const Typewriter = dynamic(
  () => import("@/components/ui/typewriter").then((m) => m.Typewriter),
  { ssr: false }
);

export function HeroSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [mode, setMode] = useState<HeroMode>("discovery");

  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    const storageKey = "vendly-hero-mode";
    const stored = window.sessionStorage.getItem(storageKey);
    if (stored === "discovery" || stored === "shopping") {
      setMode(stored);
    } else {
      window.sessionStorage.setItem(storageKey, "discovery");
    }
  }, []);

  const copy = useMemo(() => heroCopy[mode], [mode]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Searching for:", searchQuery);
  };

  if (!hasMounted) return (
    <div className="relative bg-white pt-12 pb-10 md:pt-16 md:pb-14 px-4 h-[300px]" />
  );

  return (
    <div className="relative bg-white pt-12 pb-10 md:pt-16 md:pb-14 px-4">
      <div className="container mx-auto max-w-4xl text-center">
        <h1 className={`${geistSans.className} text-xl md:text-3xl font-medium tracking-tight mb-2 text-foreground`}>
          <span>{copy.prefix} </span>
          <Typewriter
            text={copy.variants}
            speed={35}
            deleteSpeed={35}
            waitTime={3000}
            initialDelay={250}
            className="text-primary/80"
            cursorChar="_"
          />
        </h1>

        <p className="text-muted-foreground text-md md:text-md mb-4 max-w-2xl mx-auto">
          {copy.subhead}
        </p>

        <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto mb-2">
          <div className="relative">
            <HugeiconsIcon
              icon={Search01Icon}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={20}
            />
            <Input
              type="text"
              placeholder="Search stores and products..."
              className="w-full h-12 pl-12 pr-14 text-md rounded-full bg-background shadow-sm border-border hover:border-primary/50 focus:border-primary transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoComplete="off"
              suppressHydrationWarning
            />
            <Button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full p-0 grid place-items-center"
              suppressHydrationWarning
            >
              <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
