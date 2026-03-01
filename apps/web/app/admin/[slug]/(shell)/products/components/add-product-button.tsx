"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@shopvendly/ui/components/button";
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
            <DropdownMenuTrigger>
                <Button
                    type="button"
                    className="rounded-lg border border-border/70 bg-primary text-background shadow-sm hover:bg-primary/90"
                >
                    <HugeiconsIcon icon={Add01Icon} className="size-4" />
                    Add Product
                </Button>
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
