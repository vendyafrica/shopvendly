"use client"

import Image from "next/image"
import Link from "next/link"
import { Anton } from "next/font/google"
import { HugeiconsIcon } from "@hugeicons/react"
import { MetaIcon, TiktokIcon, InstagramIcon } from "@hugeicons/core-free-icons"

const anton = Anton({ weight: "400", subsets: ["latin"], display: "swap" })

export function Hero() {
  return (
    <section className="relative min-h-screen bg-black text-white overflow-hidden flex items-end pb-16 md:pb-24" id="product">
      <Image
        src="https://mplsrodasp.ufs.sh/f/9yFN4ZxbAeCYGCqT4P0y6qtUZFGzTeojCd8gH4bMhVIBcL5m"
        alt="Seller relaxing while business runs"
        fill
        className="object-cover object-center"
        priority
      />

      {/* Bottom gradient */}
      <div className="absolute inset-0 bg-linear-to-t from-[#121214] via-[#121214]/60 to-transparent" />
      {/* Left gradient */}
      <div className="absolute inset-0 bg-linear-to-r from-[#121214]/80 via-[#121214]/30 to-transparent" />

      <div className="relative mx-auto w-full max-w-6xl px-5 md:px-10 pt-32 flex flex-col items-center text-center">
        <div className="flex flex-col items-center max-w-3xl space-y-6 md:space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/20 border border-white/30 px-3.5 py-1.5 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-white">Social Commerce, Simplified</span>
          </div>

          <div className="space-y-3 md:space-y-4">
            <h1
              className={`${anton.className} text-[clamp(40px,8vw,80px)] leading-[1.05] font-black tracking-tight drop-shadow-xl`}
            >
              No more DM to order.<br /> Just buy now.
            </h1>
            <p className="text-base md:text-xl text-white/90 max-w-2xl mx-auto font-medium drop-shadow-md">
              Shareable product pages, secure payments, and delivery coordination built for social sellers.
            </p>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-3 md:gap-4">
            <Link
              href="/c"
              className="inline-flex items-center justify-center rounded-full bg-[#FF2FB2] hover:bg-[#ff4bc2] text-white font-extrabold tracking-[0.16em] uppercase px-8 py-4 text-sm shadow-xl shadow-[#FF2FB2]/40 transition-transform hover:-translate-y-1"
            >
              Get Started
            </Link>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-4 md:gap-8 pt-4 md:pt-6 text-sm text-white/90 drop-shadow-md">
            <div className="flex items-center gap-2">
              <HugeiconsIcon icon={MetaIcon} size={24} />
              <span className="font-semibold">Meta Business</span>
            </div>
            <div className="flex items-center gap-2">
              <HugeiconsIcon icon={InstagramIcon} size={24} />
              <span className="font-semibold">Instagram Shopping</span>
            </div>
            <div className="flex items-center gap-2">
              <HugeiconsIcon icon={TiktokIcon} size={24} />
              <span className="font-semibold">TikTok Marketing</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
