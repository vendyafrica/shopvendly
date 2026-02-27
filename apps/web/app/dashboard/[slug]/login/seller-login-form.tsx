"use client"

import React, { useState } from "react"
import { cn } from "@shopvendly/ui/lib/utils"
import { Button } from "@shopvendly/ui/components/button"
import {
    Field,
    FieldGroup,
    FieldLabel,
    FieldSeparator,
} from "@shopvendly/ui/components/field"
import { Input } from "@shopvendly/ui/components/input"
import { signInWithGoogle } from "@shopvendly/auth/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Loading03Icon } from "@hugeicons/core-free-icons"
import { GoogleIcon } from "@shopvendly/ui/components/svgs/google"

type FormState = "idle" | "loading"

export function SellerLoginForm({
    className,
    title,
    redirectTo,
    ...props
}: React.ComponentProps<"div"> & { title?: string; redirectTo?: string }) {
    const [email, setEmail] = useState("")
    const [formState, setFormState] = useState<FormState>("idle")
    const [error, setError] = useState<string | null>(null)

    const callbackURL = redirectTo ?? (typeof window !== "undefined" ? window.location.pathname + window.location.search : undefined)

    const handleEmailSignIn = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (!email || !email.includes("@")) {
            setError("Please enter a valid email address")
            return
        }

        setFormState("loading")

        try {
            await signInWithGoogle({
                callbackURL,
            })
        } catch {
            setError("Something went wrong. Please try again.")
            setFormState("idle")
        }
    }

    const handleGoogleSignIn = async () => {
        try {
            setFormState("loading")
            await signInWithGoogle({
                callbackURL,
            })
        } catch {
            setError("Failed to sign in with Google. Please try again.")
            setFormState("idle")
        }
    }

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <form onSubmit={handleEmailSignIn}>
                <FieldGroup className="gap-5">
                    <div className="text-start">
                        <h1 className="text-xl font-semibold">
                            {title || "Seller Login"}
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Sign in to your seller dashboard
                        </p>
                    </div>

                    {error && (
                        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                            {error}
                        </div>
                    )}

                    <Field>
                        <FieldLabel>Email</FieldLabel>
                        <Input
                            type="email"
                            inputMode="email"
                            autoComplete="email"
                            placeholder="m@example.com"
                            className="h-11 sm:h-9"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={formState === "loading"}
                        />
                    </Field>

                    <Button
                        type="submit"
                        className="h-11 sm:h-9 w-full"
                        disabled={formState === "loading"}
                    >
                        {formState === "loading" ? (
                            <>
                                <HugeiconsIcon icon={Loading03Icon} className="mr-2 h-4 w-4 animate-spin" />
                                Redirecting...
                            </>
                        ) : (
                            "Continue"
                        )}
                    </Button>

                    <FieldSeparator>or</FieldSeparator>

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
                </FieldGroup>
            </form>
        </div>
    )
}
