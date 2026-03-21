"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { Input } from "@shopvendly/ui/components/input";
import { Portal } from "@/components/portal";

interface MobileSearchProps {
    isOpen: boolean;
    onClose: () => void;
    hideSearch?: boolean;
}

export function MobileSearch({ isOpen, onClose, hideSearch = false }: MobileSearchProps) {
    if (!isOpen || hideSearch) return null;

    return (
        <Portal>
            <div className="fixed inset-0 z-50 bg-background text-foreground animate-in fade-in duration-200">
                <div className="p-4 pt-6">
                    {/* Search Header */}
                    <div className="flex items-center gap-3 mb-6">
                        <button
                            onClick={onClose}
                            className="p-2 -ml-2 rounded-lg hover:bg-muted/70 active:scale-95 transition-all"
                            aria-label="Close search"
                        >
                            <HugeiconsIcon icon={Cancel01Icon} size={22} />
                        </button>
                        <h2 className="text-lg font-semibold">Search</h2>
                    </div>

                    {/* Search Input */}
                    <div className="relative">
                        <HugeiconsIcon
                            icon={Search01Icon}
                            size={20}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                        />
                        <Input
                            autoFocus
                            type="search"
                            placeholder="Search products, stores, creators…"
                            className="h-14 pl-12 pr-4 rounded-2xl border-2 border-border focus:border-ring shadow-sm text-base bg-background transition-colors"
                        />
                    </div>

                    {/* Recent/Popular Searches Could Go Here */}
                    <div className="mt-8 text-center">
                        <p className="text-sm text-muted-foreground">
                            Start typing to search
                        </p>
                    </div>
                </div>
            </div>
        </Portal>
    );
}
