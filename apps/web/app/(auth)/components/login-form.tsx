"use client"

import React, { useState } from "react"
import { cn } from "@shopvendly/ui/lib/utils"
import { Button } from "@shopvendly/ui/components/button"
import {
    FieldGroup,
} from "@shopvendly/ui/components/field"
import { signInWithGoogle, signInWithTikTok } from "@shopvendly/auth/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Loading03Icon } from "@hugeicons/core-free-icons"
import { GoogleIcon } from "@shopvendly/ui/components/svgs/google"

type FormState = "idle" | "loading"

export function LoginForm({
    className,
    title,
    redirectTo,
    ...props
}: React.ComponentProps<"div"> & { title?: string; redirectTo?: string }) {
    const [formState, setFormState] = useState<FormState>("idle")
    const [error, setError] = useState<string | null>(null)

    const handleGoogleSignIn = async () => {
        try {
            setFormState("loading")
            const res = await signInWithGoogle({
                callbackURL: redirectTo,
            })
            if (res?.error) {
                setError(res.error.message || "Failed to sign in with Google. Please try again.")
                setFormState("idle")
            }
        } catch {
            setError("Failed to sign in with Google. Please try again.")
            setFormState("idle")
        }
    }

    const handleTikTokSignIn = async () => {
        try {
            setFormState("loading")
            const res = await signInWithTikTok({
                callbackURL: redirectTo,
            })
            if (res?.error) {
                setError(res.error.message || "Failed to sign in with TikTok. Please try again.")
                setFormState("idle")
            }
        } catch {
            setError("Failed to sign in with TikTok. Please try again.")
            setFormState("idle")
        }
    }

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <FieldGroup className="gap-6">
                <div className="text-start">
                    <h1 className="text-xl font-semibold">
                        {title || "Welcome to Vendly"}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Sign in with your Google account to continue
                    </p>
                </div>

                {error && (
                    <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                        {error}
                    </div>
                )}

                <Button
                    variant="outline"
                    type="button"
                    onClick={handleGoogleSignIn}
                    className="h-11 sm:h-9"
                    disabled={formState === "loading"}
                >
                    {formState === "loading" ? (
                        <>
                            <HugeiconsIcon icon={Loading03Icon} className="mr-2 h-4 w-4 animate-spin" />
                            Connecting...
                        </>
                    ) : (
                        <>
                            <GoogleIcon />
                            Continue with Google
                        </>
                    )}
                </Button>

                <Button
                    variant="outline"
                    type="button"
                    onClick={handleTikTokSignIn}
                    className="h-11 sm:h-9"
                    disabled={formState === "loading"}
                >
                    {formState === "loading" ? (
                        <>
                            <HugeiconsIcon icon={Loading03Icon} className="mr-2 h-4 w-4 animate-spin" />
                            Connecting...
                        </>
                    ) : (
                        "Continue with TikTok"
                    )}
                </Button>
            </FieldGroup>
        </div>
    )
}
