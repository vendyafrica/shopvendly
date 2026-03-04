"use client";

import * as React from "react";
import { Button } from "@shopvendly/ui/components/button";
import { Input } from "@shopvendly/ui/components/input";
import { Label } from "@shopvendly/ui/components/label";

export default function SettingsPage() {
    const [email, setEmail] = React.useState("");
    const [instagramProfileUrl, setInstagramProfileUrl] = React.useState("");
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [isImporting, setIsImporting] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [success, setSuccess] = React.useState<string | null>(null);
    const [importError, setImportError] = React.useState<string | null>(null);
    const [importSuccess, setImportSuccess] = React.useState<string | null>(null);

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

    const onInstagramImportSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setImportError(null);
        setImportSuccess(null);
        setIsImporting(true);

        try {
            const res = await fetch("/api/instagram-demo-store", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ profileUrl: instagramProfileUrl }),
            });

            const data = (await res.json().catch(() => ({}))) as {
                error?: string;
                importedCount?: number;
                skippedCount?: number;
                storeSlug?: string;
            };

            if (!res.ok) {
                setImportError(data.error || "Failed to import Instagram profile.");
                return;
            }

            setImportSuccess(
                `Import complete. Store /${data.storeSlug} ready with ${data.importedCount ?? 0} imported posts (${data.skippedCount ?? 0} skipped).`
            );
            setInstagramProfileUrl("");
        } catch (err: unknown) {
            setImportError(err instanceof Error ? err.message : "Failed to import Instagram profile.");
        } finally {
            setIsImporting(false);
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

            <section className="space-y-6 rounded-xl border border-border/40 bg-card p-6 shadow-sm">
                <div>
                    <h2 className="text-xl font-semibold leading-none tracking-tight mb-2">Instagram Demo Store Import</h2>
                    <p className="text-sm text-muted-foreground">
                        Paste an Instagram profile URL to import up to 50 posts and auto-create a claimable demo store.
                    </p>
                </div>

                {importSuccess && (
                    <div className="rounded-md border border-green-500/50 bg-green-500/10 px-4 py-3 text-sm text-green-700">
                        {importSuccess}
                    </div>
                )}

                {importError && (
                    <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                        {importError}
                    </div>
                )}

                <form onSubmit={onInstagramImportSubmit} className="space-y-4 max-w-2xl">
                    <div className="space-y-2">
                        <Label htmlFor="instagram-profile-url">Instagram profile URL</Label>
                        <Input
                            id="instagram-profile-url"
                            type="url"
                            value={instagramProfileUrl}
                            onChange={(e) => setInstagramProfileUrl(e.target.value)}
                            placeholder="https://www.instagram.com/your_handle/"
                            required
                            disabled={isImporting}
                        />
                    </div>
                    <Button type="submit" disabled={isImporting}>
                        {isImporting ? "Importing..." : "Import & Create Demo Store"}
                    </Button>
                </form>
            </section>
        </div>
    );
}