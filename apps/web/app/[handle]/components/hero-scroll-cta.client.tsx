"use client";

import { Button } from "@shopvendly/ui/components/button";
import type { ReactNode } from "react";

interface HeroScrollCtaProps {
  targetId: string;
  className?: string;
  children: ReactNode;
}

export function HeroScrollCta({ targetId, className, children }: HeroScrollCtaProps) {
  return (
    <Button
      type="button"
      onClick={() => {
        const target = document.getElementById(targetId);
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
          return;
        }

        window.scrollTo({ top: window.innerHeight, behavior: "smooth" });
      }}
      className={className}
    >
      {children}
    </Button>
  );
}