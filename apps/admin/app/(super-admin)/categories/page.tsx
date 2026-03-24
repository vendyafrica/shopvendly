"use client";

import * as React from "react";
import type { Category } from "./components/category-list";
import { Button } from "@shopvendly/ui/components/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { CategoryList } from "./components/category-list";
import { Skeleton } from "@shopvendly/ui/components/skeleton";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@shopvendly/ui/components/dialog";
import { Input } from "@shopvendly/ui/components/input";
import { Label } from "@shopvendly/ui/components/label";

export default function CategoriesPage() {
    const [categories, setCategories] = React.useState<Category[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isCreateOpen, setIsCreateOpen] = React.useState(false);
    const [parentId, setParentId] = React.useState<string | null>(null);

    // Form state
    const [name, setName] = React.useState("");
    const [slug, setSlug] = React.useState("");
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const fetchCategories = async () => {
        try {
            const res = await fetch("/api/categories");
            const data = await res.json();
            if (Array.isArray(data)) {
                setCategories(data as Category[]);
            } else {
                setCategories([]);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    React.useEffect(() => {
        fetchCategories();
    }, []);

    const handleCreateClick = (pid: string | null = null) => {
        setParentId(pid);
        setName("");
        setSlug("");
        setIsCreateOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const res = await fetch("/api/categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    slug,
                    parentId,
                    level: parentId ? 1 : 0, // Simplified logic, API handles level too if parentId provided
                }),
            });

            if (res.ok) {
                setIsCreateOpen(false);
                fetchCategories();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Auto-generate slug from name
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setName(val);
        setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, ""));
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-end justify-end">
                <Button onClick={() => handleCreateClick(null)}>
                    <HugeiconsIcon icon={PlusSignIcon} className="mr-1 h-4 w-4" />
                    New Main Category
                </Button>
            </div>

            <div className="rounded-md">
                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="border border-border/50 rounded-lg p-4 bg-card/50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 flex-1">
                                        <Skeleton className="h-4 w-4 rounded" />
                                        <Skeleton className="h-6 w-40" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Skeleton className="h-5 w-20 rounded-full" />
                                        <Skeleton className="h-8 w-8 rounded-md" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <CategoryList
                        categories={categories}
                        onAddSubCategory={(id) => handleCreateClick(id)}
                        onEdit={(cat) => console.log("Edit", cat)}
                    />
                )}
            </div>

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {parentId ? "Create Sub-category" : "Create Main Category"}
                        </DialogTitle>
                        <DialogDescription>
                            Add a new category to the platform.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={handleNameChange}
                                placeholder="e.g. Electronics"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="slug">Slug</Label>
                            <Input
                                id="slug"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                                placeholder="e.g. electronics"
                                required
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Creating..." : "Create Category"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
