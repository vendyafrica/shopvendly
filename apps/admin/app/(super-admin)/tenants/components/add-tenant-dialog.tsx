"use client";

import * as React from "react";
import { Button } from "@shopvendly/ui/components/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@shopvendly/ui/components/dialog";
import { Field, FieldGroup, FieldLabel } from "@shopvendly/ui/components/field";
import { Input } from "@shopvendly/ui/components/input";
import { Textarea } from "@shopvendly/ui/components/textarea";
import { Checkbox } from "@shopvendly/ui/components/checkbox";

interface CategoryOption {
    id: string;
    name: string;
    slug: string;
}

interface AddTenantDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreated?: () => void;
}

const initialFormState = {
    fullName: "",
    email: "",
    phoneNumber: "",
    storeName: "",
    storeDescription: "",
    storeLocation: "",
    categories: [] as string[],
};

export function AddTenantDialog({ open, onOpenChange, onCreated }: AddTenantDialogProps) {
    const [formState, setFormState] = React.useState(initialFormState);
    const [categories, setCategories] = React.useState<CategoryOption[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const [isLoadingCategories, setIsLoadingCategories] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const resetForm = React.useCallback(() => {
        setFormState(initialFormState);
        setError(null);
    }, []);

    React.useEffect(() => {
        if (!open) {
            resetForm();
        }
    }, [open, resetForm]);

    React.useEffect(() => {
        if (!open) return;

        const fetchCategories = async () => {
            setIsLoadingCategories(true);
            try {
                const res = await fetch("/api/categories");
                if (!res.ok) {
                    throw new Error("Failed to load categories");
                }
                const data = (await res.json()) as CategoryOption[];
                setCategories(data);
            } catch (err) {
                console.error("Failed to fetch categories", err);
            } finally {
                setIsLoadingCategories(false);
            }
        };

        fetchCategories();
    }, [open]);

    const toggleCategory = (slug: string) => {
        setFormState((prev) => {
            const exists = prev.categories.includes(slug);
            const nextCategories = exists
                ? prev.categories.filter((value) => value !== slug)
                : [...prev.categories, slug];
            return { ...prev, categories: nextCategories };
        });
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/tenants", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formState),
            });

            const payload = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(payload?.error || "Failed to create tenant");
            }

            onCreated?.();
            onOpenChange(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create tenant");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add tenant</DialogTitle>
                    <DialogDescription>
                        Create a tenant profile and send a verification link to their email.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                            {error}
                        </div>
                    )}
                    <div className="grid gap-6 lg:grid-cols-2">
                        <FieldGroup>
                            <Field>
                                <FieldLabel htmlFor="fullName">Full name</FieldLabel>
                                <Input
                                    id="fullName"
                                    value={formState.fullName}
                                    onChange={(event) =>
                                        setFormState((prev) => ({ ...prev, fullName: event.target.value }))
                                    }
                                    placeholder="Jane Doe"
                                    required
                                />
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="email">Email</FieldLabel>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formState.email}
                                    onChange={(event) =>
                                        setFormState((prev) => ({ ...prev, email: event.target.value }))
                                    }
                                    placeholder="jane@store.com"
                                    required
                                />
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="phone">Phone number</FieldLabel>
                                <Input
                                    id="phone"
                                    type="tel"
                                    value={formState.phoneNumber}
                                    onChange={(event) =>
                                        setFormState((prev) => ({ ...prev, phoneNumber: event.target.value }))
                                    }
                                    placeholder="+256 700 000 000"
                                />
                            </Field>
                        </FieldGroup>
                        <FieldGroup>
                            <Field>
                                <FieldLabel htmlFor="storeName">Store name</FieldLabel>
                                <Input
                                    id="storeName"
                                    value={formState.storeName}
                                    onChange={(event) =>
                                        setFormState((prev) => ({ ...prev, storeName: event.target.value }))
                                    }
                                    placeholder="Acme Fashion"
                                    required
                                />
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="storeLocation">Location</FieldLabel>
                                <Input
                                    id="storeLocation"
                                    value={formState.storeLocation}
                                    onChange={(event) =>
                                        setFormState((prev) => ({ ...prev, storeLocation: event.target.value }))
                                    }
                                    placeholder="Kampala, Uganda"
                                />
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="storeDescription">Store description</FieldLabel>
                                <Textarea
                                    id="storeDescription"
                                    value={formState.storeDescription}
                                    onChange={(event) =>
                                        setFormState((prev) => ({ ...prev, storeDescription: event.target.value }))
                                    }
                                    placeholder="Tell customers what this store sells."
                                    rows={3}
                                />
                            </Field>
                        </FieldGroup>
                    </div>

                    <div className="space-y-3">
                        <div className="space-y-1">
                            <p className="text-sm font-medium">Categories</p>
                            <p className="text-xs text-muted-foreground">
                                Select the categories that best describe the store.
                            </p>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                            {isLoadingCategories && (
                                <p className="text-sm text-muted-foreground">Loading categories...</p>
                            )}
                            {!isLoadingCategories && categories.length === 0 && (
                                <p className="text-sm text-muted-foreground">No categories available.</p>
                            )}
                            {categories.map((category) => (
                                <label
                                    key={category.id}
                                    className="flex items-center gap-2 rounded-md border border-border/60 px-3 py-2 text-sm"
                                >
                                    <Checkbox
                                        checked={formState.categories.includes(category.slug)}
                                        onCheckedChange={() => toggleCategory(category.slug)}
                                    />
                                    <span>{category.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Saving..." : "Save tenant"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
