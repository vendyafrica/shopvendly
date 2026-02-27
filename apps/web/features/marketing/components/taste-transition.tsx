"use client"

import { Anton } from "next/font/google"
import { useEffect, useRef, useState } from "react"
import { Highlighter } from "@/components/ui/highlighter"
import { TextAnimate } from "@/components/ui/text-animate"
import { Logo } from "./logo"

const anton = Anton({ weight: "400", subsets: ["latin"], display: "swap" })

export function TasteTransition() {
    const containerRef = useRef<HTMLElement | null>(null)
    const [hasEntered, setHasEntered] = useState(false)
    const [showHighlight, setShowHighlight] = useState(false)
    const [cycle, setCycle] = useState(0)

    useEffect(() => {
        const el = containerRef.current
        if (!el) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry?.isIntersecting) {
                    setHasEntered(true)
                    setShowHighlight(false)
                    setCycle((c) => c + 1)
                } else {
                    setHasEntered(false)
                    setShowHighlight(false)
                }
            },
            { threshold: 0.4 }
        )

        observer.observe(el)
        return () => observer.disconnect()
    }, [])

    useEffect(() => {
        if (!hasEntered) return
        const t = window.setTimeout(() => setShowHighlight(true), 1600)
        return () => window.clearTimeout(t)
    }, [hasEntered])

    return (
        <section ref={containerRef} id="pricing" className="relative py-14 md:py-20 border-t border-white/5">
            <div className="mx-auto max-w-4xl px-5 md:px-8 text-center space-y-5 md:space-y-6">
                <div className="flex justify-center items-center gap-1 group shrink-0">
                    <Logo />
                </div>
                <div className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#BDB3FF]">
                    Built for social sellers who want speed and control
                </div>
                {showHighlight ? (
                    <h2
                        key={`highlight-${cycle}`}
                        className={`${anton.className} text-[clamp(32px,5vw,52px)] font-extrabold leading-[1.18] tracking-normal text-white`}
                    >
                        Turn{" "}
                        <Highlighter action="underline" color="#4A3AFF" strokeWidth={2.2} animationDuration={1100} iterations={2} padding={2} isView>
                            engagement
                        </Highlighter>{" "}
                        into a fast, protected
                        {" "}
                        <Highlighter action="highlight" color="#5B4BFF" strokeWidth={1.6} animationDuration={1200} iterations={2} padding={3} isView>
                            checkout
                        </Highlighter>
                        .
                    </h2>
                ) : (
                    <TextAnimate
                        key={`text-${cycle}`}
                        animation="blurInUp"
                        by="word"
                        className={`text-[clamp(32px,5vw,52px)] ${anton.className} font-extrabold leading-[1.18] tracking-tight text-white`}
                        segmentClassName="inline-block"
                        delay={0.15}
                        duration={1.4}
                        startOnView={false}
                        animate={hasEntered ? "show" : "hidden"}
                    >
                        Turn engagement into a fast, protected checkout.
                    </TextAnimate>
                )}
                <p className="text-[16px] md:text-[17px] text-white/70 leading-relaxed max-w-2xl mx-auto">
                    Turn social engagement into a fast, protected checkout share a link, get paid, and ship without the DM chase.
                </p>
            </div>
        </section>
    )
}
