"use client";

import { Button } from "@shopvendly/ui/components/button";
import {
    Field,
    FieldGroup,
    FieldLabel,
} from "@shopvendly/ui/components/field";
import { Input } from "@shopvendly/ui/components/input";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

export function SignUpForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const redirectTo = searchParams.get("redirect");
    const defaultEmail = searchParams.get("email") || "";

    const handleEmailSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);

        startTransition(async () => {
            const formData = new FormData(e.currentTarget);
            const name = formData.get("name") as string;
            const email = formData.get("email") as string;
            const password = formData.get("password") as string;

            try {
                // Use custom admin signup endpoint
                const response = await fetch("/api/admin-signup", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ email, password, name }),
                });

                const data = await response.json();

                if (!response.ok) {
                    setError(data.error || "Failed to create account. Please try again.");
                    return;
                }

                // Success - redirect to login with verification message
                const loginUrl = redirectTo
                    ? `/login?message=verify-email&redirect=${encodeURIComponent(redirectTo)}`
                    : "/login?message=verify-email";
                router.push(loginUrl);
            } catch (err: unknown) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "An unexpected error occurred. Please try again."
                );
            }
        });
    };

    return (
        <div className="border-0 shadow-sm rounded-sm bg-muted/30">
            <div className="p-6 md:p-8">
                <form onSubmit={handleEmailSubmit}>
                    <FieldGroup>
                        <div className="flex flex-col items-center gap-2 mb-6">
                            <h1 className="text-foreground text-xl font-semibold tracking-tight">
                                Welcome to vendly
                            </h1>
                            <p className="text-muted-foreground text-sm">
                                Sign up to continue
                            </p>
                        </div>

                        {error && (
                            <div className="mb-5 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                                {error}
                            </div>
                        )}
                        <Field>
                            <FieldLabel htmlFor="name">Full Name</FieldLabel>
                            <Input
                                id="name"
                                name="name"
                                type="text"
                                placeholder="Steve Jobs"
                                required
                                autoComplete="name"
                                disabled={isPending}
                                className="focus-visible:border-primary/60 focus-visible:ring-primary/20"
                            />
                        </Field>

                        <Field>
                            <FieldLabel htmlFor="email">Email address</FieldLabel>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="name@example.com"
                                required
                                autoComplete="email"
                                defaultValue={defaultEmail}
                                disabled={isPending}
                                className="focus-visible:border-primary/60 focus-visible:ring-primary/20"
                            />
                        </Field>

                        <Field>
                            <FieldLabel htmlFor="password">Password</FieldLabel>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                required
                                autoComplete="current-password"
                                disabled={isPending}
                                className="focus-visible:border-primary/60 focus-visible:ring-primary/20"
                            />
                        </Field>

                        <Field>
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isPending}
                            >
                                {isPending ? "Signing up..." : "Sign up"}
                            </Button>
                        </Field>
                    </FieldGroup>
                </form>

                <div className="mt-4 text-center text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <a
                        href="/login"
                        className={`text-primary hover:underline underline-offset-4 ${isPending ? "pointer-events-none opacity-60" : ""}`}
                    >
                        Sign in
                    </a>
                </div>
            </div>
        </div>
    );
}