"use client"

import { useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { LoginForm } from "@/app/(auth)/components/login-form"
import { cn } from "@shopvendly/ui/lib/utils"

export function LoginOverlay({ onClose }: { onClose: () => void }) {
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose()
        }
        window.addEventListener("keydown", handler)
        return () => window.removeEventListener("keydown", handler)
    }, [onClose])

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />

            <div className={cn(
                "relative z-10 w-full bg-white shadow-xl",
                "rounded-t-2xl p-6 pb-12 animate-in slide-in-from-bottom-full duration-300",
                "sm:max-w-md sm:rounded-xl sm:p-8 sm:pb-8 sm:mb-0 sm:animate-in sm:zoom-in-95"
            )}>
                <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-muted sm:hidden" />

                <LoginForm />
            </div>
        </div>
    )
}

export default function LoginPage() {
    return (
        <div className="relative min-h-screen bg-gray-50 p-4 flex items-center justify-center">
            {/* Render LoginOverlay as a static component since we are on a page */}
            <div className={cn(
                "relative z-10 w-full bg-white shadow-xl",
                "rounded-t-2xl p-6 pb-12",
                "sm:max-w-md sm:rounded-xl sm:p-8 sm:pb-8 sm:mb-0"
            )}>
                <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-muted sm:hidden" />
                <Suspense fallback={<div>Loading...</div>}>
                    <LoginFormWrapper />
                </Suspense>
            </div>
        </div>
    )
}

function LoginFormWrapper() {
    const searchParams = useSearchParams()
    const redirectParam = searchParams.get("redirect")
    const nextParam = searchParams.get("next")
    const storeName = searchParams.get("store")
    const storeSlug = searchParams.get("slug")

    const title = storeName ? `Welcome to ${storeName} Admin` : "Welcome to Vendly"

    const redirectTo = redirectParam || nextParam || (storeSlug ? `/a/${storeSlug}` : undefined)

    return <LoginForm title={title} redirectTo={redirectTo} />
}
