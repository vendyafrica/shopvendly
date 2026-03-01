"use client";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@shopvendly/ui/components/accordion";
import { Button } from "@shopvendly/ui/components/button";
import { Badge } from "@shopvendly/ui/components/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    Folder01Icon,
    MoreHorizontalIcon,
    PlusSignIcon
} from "@hugeicons/core-free-icons";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@shopvendly/ui/components/dropdown-menu";

export interface Category {
    id: string;
    name: string;
    slug: string;
    children?: Category[];
    _count?: {
        storeCategories: number;
    };
}

interface CategoryListProps {
    categories: Category[];
    onAddSubCategory: (parentId: string) => void;
    onEdit: (category: Category) => void;
}

export function CategoryList({ categories, onAddSubCategory, onEdit }: CategoryListProps) {
    if (!categories.length) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center border rounded-lg bg-muted/10 border-dashed">
                <HugeiconsIcon icon={Folder01Icon} className="h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No Categories</h3>
                <p className="text-sm text-muted-foreground max-w-sm mb-4">
                    Get started by creating the main categories for the platform.
                </p>
            </div>
        );
    }

    return (
        <Accordion className="w-full space-y-4">
            {categories.map((category) => (
                <AccordionItem key={category.id} value={category.id} className="border rounded-lg px-4">
                    <div className="flex items-center justify-between py-2">
                        <AccordionTrigger className="hover:no-underline py-2">
                            <span className="font-medium text-lg">{category.name}</span>
                        </AccordionTrigger>
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="mr-2">
                                {category.slug}
                            </Badge>
                            <DropdownMenu>
                                <DropdownMenuTrigger>
                                    <Button variant="ghost" size="sm">
                                        <HugeiconsIcon icon={MoreHorizontalIcon} className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => onEdit(category)}>
                                        Edit Category
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onAddSubCategory(category.id)}>
                                        Add Sub-category
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                    <AccordionContent className="pb-4 pt-1 pl-4 border-l-2 border-muted ml-2">
                        {category.children && category.children.length > 0 ? (
                            <div className="grid gap-2 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mt-2">
                                {category.children.map((child) => (
                                    <div
                                        key={child.id}
                                        className="flex items-center justify-between p-3 rounded-md border bg-card hover:bg-accent/50 transition-colors"
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-medium">{child.name}</span>
                                            <span className="text-xs text-muted-foreground">{child.slug}</span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => onEdit(child)}
                                        >
                                            <HugeiconsIcon icon={MoreHorizontalIcon} className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-4 text-sm text-muted-foreground flex flex-col items-start gap-2">
                                <p>No sub-categories yet.</p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onAddSubCategory(category.id)}
                                >
                                    <HugeiconsIcon icon={PlusSignIcon} className="mr-2 h-3 w-3" />
                                    Add Sub-category
                                </Button>
                            </div>
                        )}
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
    );
}
