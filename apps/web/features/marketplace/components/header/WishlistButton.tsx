import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { FavouriteIcon } from "@hugeicons/core-free-icons";

export function WishlistButton() {
    return (
        <Link
            href="/wishlist"
            className="group relative p-2.5 rounded-full hover:bg-muted/70 active:scale-95 transition-all"
            aria-label="Wishlist"
        >
            <HugeiconsIcon
                icon={FavouriteIcon}
                size={22}
                className="text-muted-foreground group-hover:text-foreground transition-colors"
            />
        </Link>
    );
}
