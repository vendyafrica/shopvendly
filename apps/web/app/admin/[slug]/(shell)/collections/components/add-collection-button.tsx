"use client";

import * as React from "react";
import { Button } from "@shopvendly/ui/components/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon, Loading03Icon } from "@hugeicons/core-free-icons";

interface AddCollectionButtonProps {
    onSelect?: () => void;
    disabled?: boolean;
}

export function AddCollectionButton({ onSelect, disabled }: AddCollectionButtonProps) {
    const [isLoading, setIsLoading] = React.useState(false);

    const handleClick = React.useCallback(async () => {
        setIsLoading(true);
        // Small delay just for UX feel like products page
        await new Promise((resolve) => setTimeout(resolve, 150));
        setIsLoading(false);
        onSelect?.();
    }, [onSelect]);

    return (
        <Button onClick={handleClick} disabled={disabled || isLoading} className="flex-1 sm:flex-none">
            {isLoading ? (
                <HugeiconsIcon icon={Loading03Icon} className="animate-spin size-4" />
            ) : (
                <>
                    <HugeiconsIcon icon={PlusSignIcon} className="size-4 mr-2" />
                    <span className="hidden sm:inline">Add Collection</span>
                    <span className="sm:hidden">Add Collection</span>
                </>
            )}
        </Button>
    );
}
