"use client";

import { useState, useEffect } from "react";
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

  const copy = heroCopy[mode];

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
      </div>
    </div>
  );
}
