"use client";

import { Button } from "@shopvendly/ui/components/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@shopvendly/ui/components/field";
import { Input } from "@shopvendly/ui/components/input";
import { signIn, signInWithGoogle } from "../../../lib/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const redirectTo = searchParams.get("redirect");

  const message = searchParams.get("message");
  const urlError = searchParams.get("error");

  const successMessage =
    message === "verify-email"
      ? "Account created! Please check your email to verify your account."
      : message === "email-verified"
        ? "Email verified successfully! You can now sign in."
        : null;

  const urlErrorMessage =
    urlError === "invalid-verification-link"
      ? "Invalid verification link. Please try signing up again."
      : urlError === "invalid-or-expired-token"
        ? "Verification link is invalid or has expired. Please request a new one."
        : urlError === "token-expired"
          ? "Verification link has expired. Please request a new one."
          : urlError === "user-not-found"
            ? "User not found. Please sign up first."
            : urlError === "verification-failed"
              ? "Email verification failed. Please try again."
              : null;

  const handleEmailSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const formData = new FormData(e.currentTarget);
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;

      try {
        const { error } = await signIn(email, password);

        if (error) {
          // Handle different error types from Better Auth
          let errorMessage = "Invalid email or password. Please try again.";

          if (error.status === 401) {
            // User not found or invalid credentials
            errorMessage = "Account not found. Please sign up first or check your credentials.";
          } else if (error.status === 403 || error.message?.toLowerCase().includes("verify")) {
            errorMessage = "Please verify your email address first.";
          } else if (error.message) {
            errorMessage = error.message;
          }

          setError(errorMessage);
          return;
        }

        // Success → session cookie is set, redirect to dashboard
        router.push(redirectTo || "/dashboard");
        router.refresh();
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : "An unexpected error occurred. Please try again."
        );
      }
    });
  };

  const handleGoogleClick = () => {
    setError(null);

    startTransition(() => {
      try {
        // This usually triggers a redirect to Google → promise may not resolve here
        signInWithGoogle();
        // No need to await or handle return value in most cases
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to start Google sign-in. Please try again."
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
                Welcome back
              </h1>
              <p className="text-muted-foreground text-sm">
                Sign in to continue
              </p>
            </div>

            {successMessage && (
              <div className="mb-5 rounded-lg border border-green-500/50 bg-green-500/10 px-4 py-3 text-sm text-green-700">
                {successMessage}
              </div>
            )}

            {urlErrorMessage && !error && (
              <div className="mb-5 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {urlErrorMessage}
              </div>
            )}

            {error && (
              <div className="mb-5 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Field>
              <FieldLabel htmlFor="email">Email address</FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@example.com"
                required
                autoComplete="email"
                disabled={isPending}
                className="focus-visible:border-primary/60 focus-visible:ring-primary/20"
              />
            </Field>

            <Field>
              <div className="flex items-center justify-between">
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <a
                  href="/forgot-password"
                  className={`text-sm text-primary hover:underline underline-offset-4 ${isPending ? "pointer-events-none opacity-60" : ""}`}
                >
                  Forgot password?
                </a>
              </div>
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
                {isPending ? "Signing in..." : "Sign in"}
              </Button>
            </Field>

            <FieldSeparator>or continue with</FieldSeparator>

            <Field>
              <Button
                type="button"
                variant="outline"
                className="w-full h-10 gap-2"
                onClick={handleGoogleClick}
                disabled={isPending}
              >
                <svg
                  role="img"
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.51h5.84c-.25 1.31-.98 2.42-2.07 3.16v2.63h3.35c1.96-1.81 3.09-4.47 3.09-7.8z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-1.01 7.28-2.73l-3.35-2.63c-1.01.68-2.29 1.08-3.93 1.08-3.02 0-5.58-2.04-6.49-4.79H.96v2.67C2.77 20.39 6.62 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.51 14.21c-.23-.68-.36-1.41-.36-2.21s.13-1.53.36-2.21V7.34H.96C.35 8.85 0 10.39 0 12s.35 3.15.96 4.66l4.55-2.45z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.98c1.64 0 3.11.56 4.27 1.66l3.19-3.19C17.46 1.01 14.97 0 12 0 6.62 0 2.77 2.61 0.96 6.34l4.55 2.45C6.42 6.02 8.98 4.98 12 4.98z"
                  />
                </svg>
                Continue with Google
              </Button>
            </Field>
          </FieldGroup>
        </form>

        <div className="mt-4 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <a href="/sign-up" className="text-primary hover:underline underline-offset-4">
            Sign up
          </a>
        </div>
      </div>
    </div>
  );
}