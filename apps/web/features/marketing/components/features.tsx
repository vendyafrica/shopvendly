"use client"

import Image from "next/image"
import { useEffect, useMemo, useRef, useState } from "react"

const steps = [
    {
        num: "01",
        tab: "Post",
        title: "Post once, link every product.",
        body: "Drop your ShopVendly link in bio or caption. Every product gets its own link—dress, serum, bundle—so buyers land on the exact thing they saw.",
        media: { type: "image", src: "https://mplsrodasp.ufs.sh/f/9yFN4ZxbAeCYJSC8u5AGXKmU67zhiVxFL4cqrgDYdMQaenAN" }
    },
    {
        num: "02",
        tab: "Buy",
        title: "They tap, they pay.",
        body: "Buyers go to a product page. Checkout instantly.",
        media: { type: "video", src: "https://cdn.cosmos.so/08020ebf-2819-4bb1-ab66-ae3642a73697.mp4" }
    },
    {
        num: "03",
        tab: "Ping",
        title: "Instant order ping.",
        body: "The moment an order lands, WhatsApp sends buyer name, number, address, and items.",
        media: { type: "image", src: "https://mplsrodasp.ufs.sh/f/9yFN4ZxbAeCYbewHzom1tJzyuCTxU2RmXc6QZOKgE8wSPGIn" }
    },
    {
        num: "04",
        tab: "Credit",
        title: "Creators get credit automatically.",
        body: "Give any creator a tagged link. Every sale they drive is tracked and commission ready in your dashboard. They earn; you grow.",
        media: { type: "image", src: "https://mplsrodasp.ufs.sh/f/9yFN4ZxbAeCYBgl6bhtJ1aPV9vKIdZyqjXue6k7FNTswrcLA" }
    }
]

export function Features() {
    const tabs = useMemo(() => steps.map((s) => s.tab), [])
    const [activeIndex, setActiveIndex] = useState(0)
    const [isPaused, setIsPaused] = useState(false)
    const lastManualSwitchRef = useRef<number>(0)

    useEffect(() => {
        if (isPaused) return
        const id = window.setInterval(() => {
            const now = Date.now()
            if (now - lastManualSwitchRef.current < 7000) return
            setActiveIndex((i) => (i + 1) % steps.length)
        }, 4500)
        return () => window.clearInterval(id)
    }, [isPaused])

    const step = steps[activeIndex]!

    return (
        <section id="product" className="relative overflow-hidden pt-20 md:pt-32 pb-16 md:pb-24 flex flex-col justify-center min-h-screen"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {/* Background media */}
            {step.media.type === "image" ? (
                <Image
                    key={step.media.src}
                    src={step.media.src}
                    alt={step.title}
                    fill
                    sizes="100vw"
                    className="absolute inset-0 h-full w-full object-cover object-[50%_30%]"
                    priority={false}
                />
            ) : (
                <video
                    key={step.media.src}
                    className="absolute inset-0 h-full w-full object-cover object-[50%_30%]"
                    src={step.media.src}
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
                        How it works
                    </div>
                    <h2
                        className="text-[clamp(32px,5vw,52px)] font-extrabold leading-[1.06] text-white"
                        style={{ fontFamily: 'var(--font-sora), Sora, sans-serif', letterSpacing: '-1.5px' }}
                    >
                        From post to paid.<br />
                        <span className="text-white/60">In four steps.</span>
                    </h2>
                    <p className="mt-5 text-[16px] text-white/80 max-w-2xl leading-relaxed">
                        No DMs. No back-and-forth. No dropped orders. Your content does
                        the selling — Shopvendly handles everything that comes after.
                    </p>
                </div>

                <div className="flex-1 flex flex-col justify-end">
                    <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-8">
                        {tabs.map((tab, i) => {
                            const isActive = i === activeIndex
                            return (
                                <button
                                    key={tab}
                                    type="button"
                                    onClick={() => {
                                        lastManualSwitchRef.current = Date.now()
                                        setActiveIndex(i)
                                    }}
                                    className={
                                        isActive
                                            ? "px-4 py-2 rounded-full bg-white text-[#0A0A0F] text-[11px] font-bold tracking-widest uppercase"
                                            : "px-4 py-2 rounded-full border border-white/20 bg-black/20 backdrop-blur-md hover:bg-white/10 text-white text-[11px] font-bold tracking-widest uppercase transition-colors"
                                    }
                                >
                                    {tab}
                                </button>
                            )
                        })}
                    </div>

                    <div className="max-w-2xl">
                        <div
                            className="text-[11px] font-bold tracking-widest text-[#BDB3FF] mb-4"
                            style={{ fontFamily: 'var(--font-sora), Sora, sans-serif' }}
                        >
                            {step.num}
                        </div>
                        <div
                            className="text-[clamp(28px,4vw,44px)] font-extrabold text-white leading-[1.05]"
                            style={{ fontFamily: 'var(--font-sora), Sora, sans-serif', letterSpacing: '-1px' }}
                        >
                            {step.title}
                        </div>
                        <p className="mt-5 text-[15px] md:text-[16px] text-white/85 leading-relaxed max-w-xl">
                            {step.body}
                        </p>
                    </div>

                    <div className="mt-8 flex items-center">
                        <div className="flex items-center gap-2">
                            {steps.map((_, i) => (
                                <div
                                    key={i}
                                    className={
                                        i === activeIndex
                                            ? "h-1.5 w-6 rounded-full bg-white"
                                            : "h-1.5 w-6 rounded-full bg-white/25"
                                    }
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}