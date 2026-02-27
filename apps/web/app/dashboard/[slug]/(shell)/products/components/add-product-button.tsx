"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@shopvendly/ui/components/button";

interface AddProductButtonProps {
    onUploadClick: () => void;
}

export function AddProductButton({
    onUploadClick,
}: AddProductButtonProps) {
    return (
        <Button
            type="button"
            onClick={onUploadClick}
            className="rounded-lg border border-border/70 bg-primary text-background shadow-sm hover:bg-primary/90"
        >
            <HugeiconsIcon icon={Add01Icon} className="size-4" />
            Add Product
        </Button>
    );
}
