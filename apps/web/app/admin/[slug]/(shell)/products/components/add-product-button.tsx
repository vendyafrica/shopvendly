"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@shopvendly/ui/components/dropdown-menu";

interface AddProductButtonProps {
    onSelect: (mode: "single" | "multiple") => void;
}

export function AddProductButton({ onSelect }: AddProductButtonProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-primary px-3 py-2 text-background shadow-sm hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
                <HugeiconsIcon icon={Add01Icon} className="size-4" />
                Add Product
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-48">
                <DropdownMenuItem className="cursor-pointer" onClick={() => onSelect("single")}>
                    Single item
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => onSelect("multiple")}>
                    Multiple items
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
