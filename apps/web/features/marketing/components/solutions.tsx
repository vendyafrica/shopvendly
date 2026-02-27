"use client";

import { useState } from "react";
import Link from "next/link";
import { Anton } from "next/font/google";
import Image from "next/image";

const anton = Anton({ weight: "400", subsets: ["latin"], display: "swap" });

const tabs = ["For Stores", "For Creators"] as const;
type Tab = (typeof tabs)[number];

const mediaByTab: Record<Tab, { type: "image" | "video"; src: string }> = {
  "For Stores": {
    type: "image",
    src: "https://mplsrodasp.ufs.sh/f/9yFN4ZxbAeCYifHyLe60at1rXmHEClZ7YGDu6ofqAn9whBxz",
  },
  "For Creators": {
    type: "image",
    src: "https://mplsrodasp.ufs.sh/f/9yFN4ZxbAeCYDU5VMoEFldC5yAexJX0UPbcvMfWYIpsTjn4G",
  },
};

const content: Record<
  Tab,
  {
    eyebrow: string;
    title: string;
    body: string;
    cta: string;
    ctaHref: string;
  }
> = {
  "For Stores": {
    eyebrow: "For Stores",
    title: "Put an engine\n behind your store.",
    body: "Drop product links on every post. Buyers checkout instantly; you get paid and notified without babysitting your inbox.",
    cta: "Create your store",
    ctaHref: "/c",
  },
  "For Creators": {
    eyebrow: "For Creators",
    title: "Turn engagement into earnings.",
    body: "Share tagged links, get automatic credit for every sale, and show brands the revenue you drive.",
    cta: "Apply here",
    ctaHref: "/c",
  },
};

export function Solutions() {
  const [active, setActive] = useState<Tab>("For Stores");
  const media = mediaByTab[active];

  return (
    <section
      id="solutions"
      className="relative overflow-hidden pt-20 md:pt-32 pb-16 md:pb-24 flex flex-col justify-center min-h-screen"
    >
      {/* Background media */}
      {media.type === "image" ? (
        <Image
          key={media.src}
          src={media.src}
          fill
          sizes="100vw"
          alt={active}
          className="absolute inset-0 h-full w-full object-cover object-[50%_30%]"
          loading="lazy"
        />
      ) : (
        <video
          key={media.src}
          className="absolute inset-0 h-full w-full object-cover object-[50%_30%]"
          src={media.src}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
        />
      )}
      <div className="absolute inset-0 bg-linear-to-r from-[#121214] via-[#121214]/80 to-[#121214]/30" />

      <div className="relative mx-auto w-full max-w-6xl px-5 md:px-8 z-10 flex flex-col flex-1 h-full">
        {/* Header */}
        <div className="mb-12 md:mb-16">
          <div className="text-[11px] font-semibold tracking-[2px] uppercase text-[#BDB3FF] mb-5">
            Solutions
          </div>
          <h2
            className={`${anton.className} text-[clamp(30px,4.5vw,50px)] font-extrabold text-white leading-[1.08] tracking-normal`}
          >
            Built for how you
            <br />
            <span className="text-white/60">already sell.</span>
          </h2>
        </div>

        <div className="flex-1 flex flex-col justify-end">
          {/* Tabs */}
          <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-8">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActive(tab)}
                className={
                  active === tab
                    ? "px-5 py-2.5 rounded-full bg-white text-[#0A0A0F] text-[12px] font-bold tracking-widest uppercase"
                    : "px-5 py-2.5 rounded-full border border-white/20 bg-black/20 backdrop-blur-md hover:bg-white/10 text-white text-[12px] font-bold tracking-widest uppercase transition-colors"
                }
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="max-w-2xl">
            <div className="text-[11px] font-semibold tracking-[1.5px] uppercase text-[#BDB3FF] mb-4">
              {content[active].eyebrow}
            </div>
            <h3
              className="text-[clamp(30px,4vw,46px)] font-extrabold text-white leading-[1.08] mb-4"
              style={{
                fontFamily: "var(--font-sora), Sora, sans-serif",
                letterSpacing: "-1px",
              }}
            >
              {content[active].title.split("\n").map((line, i) => (
                <span key={i}>
                  {line}
                  {i === 0 && <br />}
                </span>
              ))}
            </h3>
            <p className="text-[15px] md:text-[16px] text-white/85 leading-relaxed mb-8 max-w-xl">
              {content[active].body}
            </p>
            <Link
              href={content[active].ctaHref}
              className="inline-flex items-center gap-2 text-[15px] font-semibold text-[#0A0A0F] bg-white hover:bg-white/90 rounded-full px-7 py-4 transition-all duration-200 shadow-lg shadow-black/15 hover:-translate-y-0.5"
            >
              {content[active].cta}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
