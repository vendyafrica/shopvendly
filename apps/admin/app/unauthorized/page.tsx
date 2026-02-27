"use client";

import Link from "next/link";
import { Button } from "@shopvendly/ui/components/button";
import { signOut } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function UnauthorizedPage() {
    const router = useRouter();
    const [isSigningOut, setIsSigningOut] = useState(false);

    const handleSignOut = async () => {
        setIsSigningOut(true);
        try {
            await signOut();
            router.push("/login");
            router.refresh();
        } catch (error) {
            console.error("Sign out error:", error);
            setIsSigningOut(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <div className="mx-auto max-w-md space-y-6 text-center">
                <div className="space-y-2">
                    <h1 className="text-4xl font-bold tracking-tighter">Access Denied</h1>
                    <p className="text-muted-foreground">
                        You don't have permission to access this page.
                    </p>
                </div>

                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                    <p className="text-sm text-destructive">
                        This area is restricted to super administrators only.
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                        If you just signed up, please contact an administrator to grant you access.
                    </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                    <Button onClick={handleSignOut} disabled={isSigningOut}>
                        {isSigningOut ? "Signing out..." : "Sign Out"}
                    </Button>
                    <Button variant="outline">
                        <Link href="/login">Back to Login</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
