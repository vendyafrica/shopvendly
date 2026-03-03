"use client";

import * as React from "react";
import { Button } from "@shopvendly/ui/components/button";
import { Input } from "@shopvendly/ui/components/input";
import { Label } from "@shopvendly/ui/components/label";

export default function SettingsPage() {
    const [email, setEmail] = React.useState("");
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [success, setSuccess] = React.useState<string | null>(null);

    const onInviteSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setIsSubmitting(true);

        try {
            const res = await fetch("/api/super-admin/invite", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                setError(data?.error || "Failed to send invite.");
                return;
            }

            setSuccess("Invite sent successfully.");
            setEmail("");
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to send invite.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col gap-8 max-w-4xl">
            <div>
                <p className="text-muted-foreground">
                    Manage your super admin account settings and system preferences.
                </p>
            </div>

            <section className="space-y-6 rounded-xl border border-border/40 bg-card p-6 shadow-sm">
                <div>
                    <h2 className="text-xl font-semibold leading-none tracking-tight mb-2">Invite Super Admin</h2>
                    <p className="text-sm text-muted-foreground">
                        Send an invite link (valid for 24 hours) to promote another user to super admin. They should already have an account.
                    </p>
                </div>

                {success && (
                    <div className="rounded-md border border-green-500/50 bg-green-500/10 px-4 py-3 text-sm text-green-700">
                        {success}
                    </div>
                )}

                {error && (
                    <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                        {error}
                    </div>
                )}

                <form onSubmit={onInviteSubmit} className="space-y-4 max-w-md">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email address</Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@example.com"
                            required
                            disabled={isSubmitting}
                        />
                    </div>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Sending Invite..." : "Send Invite"}
                    </Button>
                </form>
            </section>
        </div>
    );
}