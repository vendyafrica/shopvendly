import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  InstagramIcon,
  WhatsappIcon,
} from "@hugeicons/core-free-icons";
import { bricolage } from "@/utils/fonts";
import { getRootUrl } from "@/utils/misc";
import { Button } from "@shopvendly/ui/components/button";

interface StorefrontFooterProps {
  store: {
    name: string;
    description: string | null;
    slug: string;
  };
}

export function StorefrontFooter({ store }: StorefrontFooterProps) {
  const storeName = store.name ?? "Store";
  const storeDescription = store.description ?? "Curated collections.";

  return (
    <footer className="pt-12 pb-7 border-t border-border bg-background">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col items-center justify-center space-y-8 mb-12">
          {/* Brand */}
          <div>
            <Link
              href="/"
              className={`${bricolage.className} font-bold text-2xl tracking-tight transition-colors flex items-center gap-2`}
            >
              {storeName}
            </Link>
          </div>

          {/* Links */}
          <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
            <li>
              <Link
                href={`/${store.slug}`}
                className="text-sm transition-colors duration-200 text-muted-foreground hover:text-primary"
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                href={`/${store.slug}/cart`}
                className="text-sm transition-colors duration-200 text-muted-foreground hover:text-primary"
              >
                Shopping Bag
              </Link>
            </li>
            <li>
              <Link
                href="/wishlist"
                className="text-sm transition-colors duration-200 text-muted-foreground hover:text-primary"
              >
                Wishlist
              </Link>
            </li>
            <li>
              <Link
                href={getRootUrl(`/login?next=${encodeURIComponent(`/${store.slug}`)}`)}
                className="text-sm transition-colors duration-200 text-muted-foreground hover:text-primary"
              >
                Account
              </Link>
            </li>
            <li>
              <Link
                href="/shop-policies"
                className="text-sm transition-colors duration-200 text-muted-foreground hover:text-primary"
              >
                Shop Policies
              </Link>
            </li>
            <li>
              <a
                href={`mailto:hello@vendlyafrica.store?subject=Inquiry for ${store.name}`}
                className="text-sm transition-colors duration-200 text-muted-foreground hover:text-primary"
              >
                Contact Us
              </a>
            </li>
          </ul>

          {/* Social Links */}
          <div className="flex items-center justify-center gap-6">
            <a
              href="#"
              className="text-muted-foreground hover:text-primary transition-all duration-200 ease-in-out"
              aria-label="Instagram"
            >
              <HugeiconsIcon icon={InstagramIcon} size={20} />
            </a>
            <a
              href="#"
              className="text-muted-foreground hover:text-primary transition-all duration-200 ease-in-out"
              aria-label="WhatsApp"
            >
              <HugeiconsIcon icon={WhatsappIcon} size={20} />
            </a>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 text-center">
          <p className="text-xs text-muted-foreground">
            Powered by{" "}
            <Link
              href="https://shopvendly.store"
              className={`${bricolage.className} font-medium text-foreground hover:text-primary transition-all duration-200 ease-in-out`}
              target="_blank"
              rel="noopener noreferrer"
            >
              shopvendly
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
