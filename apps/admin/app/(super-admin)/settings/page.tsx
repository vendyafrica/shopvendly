"use client";

import * as React from "react";
import { Button } from "@shopvendly/ui/components/button";
import { Input } from "@shopvendly/ui/components/input";
import { Label } from "@shopvendly/ui/components/label";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading03Icon } from "@hugeicons/core-free-icons";

type ImportJob = {
    id: string;
    status: "running" | "completed" | "failed";
    profileUrl: string;

    foundCount: number;
    processedCount: number;
    importedCount: number;
    skippedCount: number;
    storeId?: string;
    storeSlug?: string;
    error?: string;
};

type UnclaimedStore = {
    id: string;
    name: string;
    slug: string;
};

export default function SettingsPage() {
    const [email, setEmail] = React.useState("");
    const [sellerEmail, setSellerEmail] = React.useState("");
    const [selectedStoreId, setSelectedStoreId] = React.useState("");
    const [unclaimedStores, setUnclaimedStores] = React.useState<UnclaimedStore[]>([]);
    const [instagramProfileUrl, setInstagramProfileUrl] = React.useState("");
    const [deliveryProviderPhone, setDeliveryProviderPhone] = React.useState("");
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [isAssigningStore, setIsAssigningStore] = React.useState(false);
    const [isLoadingUnclaimedStores, setIsLoadingUnclaimedStores] = React.useState(false);
    const [isImporting, setIsImporting] = React.useState(false);
    const [isSavingDeliveryProvider, setIsSavingDeliveryProvider] = React.useState(false);

    const [error, setError] = React.useState<string | null>(null);
    const [success, setSuccess] = React.useState<string | null>(null);
    const [importError, setImportError] = React.useState<string | null>(null);
    const [importSuccess, setImportSuccess] = React.useState<string | null>(null);
    const [assignStoreError, setAssignStoreError] = React.useState<string | null>(null);
    const [assignStoreSuccess, setAssignStoreSuccess] = React.useState<string | null>(null);
    const [deliveryProviderError, setDeliveryProviderError] = React.useState<string | null>(null);
    const [deliveryProviderSuccess, setDeliveryProviderSuccess] = React.useState<string | null>(null);
    const [importJob, setImportJob] = React.useState<ImportJob | null>(null);

    const loadUnclaimedStores = React.useCallback(async () => {
        setIsLoadingUnclaimedStores(true);
        try {
            const res = await fetch("/api/super-admin/unclaimed-stores", { cache: "no-store" });
            const data = (await res.json().catch(() => [])) as Array<UnclaimedStore> | { error?: string };

            if (!res.ok || !Array.isArray(data)) {
                throw new Error(Array.isArray(data) ? "Failed to fetch unclaimed stores." : data.error || "Failed to fetch unclaimed stores.");
            }

            setUnclaimedStores(data);
            setSelectedStoreId((prev) => {
                if (prev && data.some((store) => store.id === prev)) {
                    return prev;
                }
                return data[0]?.id ?? "";
            });
        } catch (err: unknown) {
            setAssignStoreError(err instanceof Error ? err.message : "Failed to fetch unclaimed stores.");
        } finally {
            setIsLoadingUnclaimedStores(false);
        }
    }, []);

    React.useEffect(() => {
        const loadCurrentDeliveryProvider = async () => {
            try {
                const res = await fetch("/api/stores", { cache: "no-store" });
                if (!res.ok) return;

                const stores = (await res.json().catch(() => [])) as Array<{ deliveryProviderPhone?: string | null }>;
                const firstConfigured = stores.find((store) => Boolean(store.deliveryProviderPhone?.trim()))?.deliveryProviderPhone;

                if (firstConfigured) {
                    setDeliveryProviderPhone(firstConfigured);
                }
            } catch {
                // no-op: settings page remains usable even if prefill fails
            }
        };

        void loadCurrentDeliveryProvider();
        void loadUnclaimedStores();
    }, [loadUnclaimedStores]);

    const onAssignStoreSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setAssignStoreError(null);
        setAssignStoreSuccess(null);
        setIsAssigningStore(true);

        try {
            const res = await fetch("/api/super-admin/assign-store", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: sellerEmail,
                    storeId: selectedStoreId,
                }),
            });

            const data = (await res.json().catch(() => ({}))) as {
                error?: string;
                emailSent?: boolean;
                emailError?: string | null;
            };

            if (!res.ok) {
                setAssignStoreError(data.error || "Failed to assign store.");
                return;
            }

            const baseMessage = data.emailSent
                ? "Store assigned and claim email sent successfully."
                : "Store assigned, but email could not be sent.";
            const fullMessage = data.emailError ? `${baseMessage} (${data.emailError})` : baseMessage;

            setAssignStoreSuccess(fullMessage);
            setSellerEmail("");
            await loadUnclaimedStores();
        } catch (err: unknown) {
            setAssignStoreError(err instanceof Error ? err.message : "Failed to assign store.");
        } finally {
            setIsAssigningStore(false);
        }
    };

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

    const onGlobalDeliveryProviderSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setDeliveryProviderError(null);
        setDeliveryProviderSuccess(null);
        setIsSavingDeliveryProvider(true);

        try {
            const res = await fetch("/api/stores", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    deliveryProviderPhone: deliveryProviderPhone.trim() || null,
                }),
            });

            const data = (await res.json().catch(() => ({}))) as { error?: string };
            if (!res.ok) {
                setDeliveryProviderError(data.error || "Failed to update delivery provider number.");
                return;
            }

            setDeliveryProviderSuccess("Global delivery provider number saved for all stores.");
        } catch (err: unknown) {
            setDeliveryProviderError(err instanceof Error ? err.message : "Failed to update delivery provider number.");
        } finally {
            setIsSavingDeliveryProvider(false);
        }
    };

    const onInstagramImportSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setImportError(null);
        setImportSuccess(null);
        setImportJob(null);
        setIsImporting(true);

        try {
            const res = await fetch("/api/instagram-demo-store", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ profileUrl: instagramProfileUrl }),
            });

            const data = (await res.json().catch(() => ({}))) as {
                error?: string;
                jobId?: string;
            };

            if (!res.ok) {
                setImportError(data.error || "Failed to import Instagram profile.");
                return;
            }

            if (!data.jobId) {
                setImportError("Import started but no job ID was returned.");
                return;
            }

            let completed = false;
            while (!completed) {
                const jobRes = await fetch(`/api/instagram-demo-store?jobId=${encodeURIComponent(data.jobId)}`, {
                    cache: "no-store",
                });
                const jobData = (await jobRes.json().catch(() => ({}))) as ImportJob & { error?: string };

                if (!jobRes.ok) {
                    throw new Error(jobData.error || "Failed to read import progress");
                }

                setImportJob(jobData);

                if (jobData.status === "completed") {
                    setImportSuccess(
                        `Import complete. Store /${jobData.storeSlug} ready with ${jobData.importedCount ?? 0} imported posts (${jobData.skippedCount ?? 0} skipped).`
                    );
                    setInstagramProfileUrl("");
                    await loadUnclaimedStores();
                    if (jobData.storeId) {
                        setSelectedStoreId(jobData.storeId);
                    }
                    completed = true;
                    break;
                }

                if (jobData.status === "failed") {
                    setImportError(jobData.error || "Failed to import Instagram profile.");
                    completed = true;
                    break;
                }

                await new Promise((resolve) => setTimeout(resolve, 1000));
            }
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
                    <h2 className="text-xl font-semibold leading-none tracking-tight mb-2">Assign Store to Seller</h2>
                    <p className="text-sm text-muted-foreground">
                        Enter seller email and choose an unclaimed store to send a claim link. The seller will complete onboarding, update store details, and continue to admin.
                    </p>
                </div>

                {assignStoreSuccess && (
                    <div className="rounded-md border border-green-500/50 bg-green-500/10 px-4 py-3 text-sm text-green-700">
                        {assignStoreSuccess}
                    </div>
                )}

                {assignStoreError && (
                    <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                        {assignStoreError}
                    </div>
                )}

                <form onSubmit={onAssignStoreSubmit} className="space-y-4 max-w-2xl">
                    <div className="space-y-2">
                        <Label htmlFor="seller-email">Seller email</Label>
                        <Input
                            id="seller-email"
                            type="email"
                            value={sellerEmail}
                            onChange={(e) => setSellerEmail(e.target.value)}
                            placeholder="seller@example.com"
                            required
                            disabled={isAssigningStore}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="unclaimed-store">Unclaimed store</Label>
                        <select
                            id="unclaimed-store"
                            value={selectedStoreId}
                            onChange={(e) => setSelectedStoreId(e.target.value)}
                            required
                            disabled={isAssigningStore || isLoadingUnclaimedStores || unclaimedStores.length === 0}
                            className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {unclaimedStores.length === 0 ? (
                                <option value="">No unclaimed stores available</option>
                            ) : null}
                            {unclaimedStores.map((store) => (
                                <option key={store.id} value={store.id}>
                                    {store.name} ({store.slug})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button type="submit" disabled={isAssigningStore || isLoadingUnclaimedStores || unclaimedStores.length === 0}>
                            {isAssigningStore ? "Assigning..." : "Assign & Send Claim Email"}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={isLoadingUnclaimedStores}
                            onClick={() => {
                                void loadUnclaimedStores();
                            }}
                        >
                            {isLoadingUnclaimedStores ? "Refreshing..." : "Refresh Stores"}
                        </Button>
                    </div>
                </form>
            </section>

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
                    <h2 className="text-xl font-semibold leading-none tracking-tight mb-2">Global Delivery Provider Number</h2>
                    <p className="text-sm text-muted-foreground">
                        Set one delivery provider phone number to be used for all stores.
                    </p>
                </div>

                {deliveryProviderSuccess && (
                    <div className="rounded-md border border-green-500/50 bg-green-500/10 px-4 py-3 text-sm text-green-700">
                        {deliveryProviderSuccess}
                    </div>
                )}

                {deliveryProviderError && (
                    <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                        {deliveryProviderError}
                    </div>
                )}

                <form onSubmit={onGlobalDeliveryProviderSubmit} className="space-y-4 max-w-md">
                    <div className="space-y-2">
                        <Label htmlFor="delivery-provider-phone">Delivery provider phone</Label>
                        <Input
                            id="delivery-provider-phone"
                            type="tel"
                            value={deliveryProviderPhone}
                            onChange={(e) => setDeliveryProviderPhone(e.target.value)}
                            placeholder="+2567XXXXXXXX"
                            disabled={isSavingDeliveryProvider}
                        />
                    </div>
                    <Button type="submit" disabled={isSavingDeliveryProvider}>
                        {isSavingDeliveryProvider ? "Saving..." : "Save Number"}
                    </Button>
                </form>
            </section>

            <section className="space-y-6 rounded-xl border border-border/40 bg-card p-6 shadow-sm">
                <div>
                    <h2 className="text-xl font-semibold leading-none tracking-tight mb-2">Instagram Demo Store Import</h2>
                    <p className="text-sm text-muted-foreground">
                        Paste an Instagram profile URL to import up to 50 posts and auto-create a demo store.
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
                        {isImporting ? (
                            <span className="inline-flex items-center gap-2">
                                <HugeiconsIcon icon={Loading03Icon} size={16} className="animate-spin" />
                                Importing...
                            </span>
                        ) : "Import & Create Demo Store"}
                    </Button>
                </form>

                {isImporting && importJob && (
                    <div className="rounded-md border border-border bg-muted/30 px-4 py-3 text-sm">
                        <p className="font-medium">Import progress</p>
                        <p className="text-muted-foreground mt-1">
                            Found: <span className="font-semibold text-foreground">{importJob.foundCount}</span>
                            {" · "}
                            Processed: <span className="font-semibold text-foreground">{importJob.processedCount}</span>
                            {" · "}
                            Imported: <span className="font-semibold text-foreground">{importJob.importedCount}</span>
                            {" · "}
                            Skipped: <span className="font-semibold text-foreground">{importJob.skippedCount}</span>
                        </p>
                    </div>
                )}
            </section>
        </div>
    );
}