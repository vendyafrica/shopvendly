"use client";

import { useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  InstagramIcon,
  NewTwitterIcon,
  Facebook01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@shopvendly/ui/components/button";
import { Bricolage_Grotesque } from "next/font/google";
import { Input } from "@shopvendly/ui/components/input";
import { getRootUrl } from "@/utils/misc";

const geistSans = Bricolage_Grotesque({
  variable: "--font-bricolage-grotesque",
  subsets: ["latin"],
});

interface StorefrontFooterProps {
  store: {
    name: string;
    description: string | null;
    slug: string;
  };
}

export function StorefrontFooter({ store }: StorefrontFooterProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    setSubscribed(true);
    setPhoneNumber("");
  };

  const storeName = store.name ?? "Store";
  const storeDescription = store.description ?? "Curated collections.";

  return (
    <footer className="pt-12 pb-7 border-t border-border bg-background">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div>
            <Link
              href="/"
              className={`${geistSans.className} font-semibold text-xl sm:text-xl tracking-tight transition-colors`}
            >
              {storeName}
            </Link>{" "}
            <p className="text-sm leading-relaxed text-muted-foreground">
              {storeDescription}
            </p>
          </div>

          <div>
            <h4 className="text-sm font-medium uppercase tracking-wider mb-4 text-muted-foreground">
              Navigation
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href={`/${store.slug}`}
                  className="text-sm transition-colors duration-200 text-foreground hover:text-muted-foreground"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href={`/${store.slug}/cart`}
                  className="text-sm transition-colors duration-200 text-foreground hover:text-muted-foreground"
                >
                  Shopping Bag
                </Link>
              </li>
              <li>
                <Link
                  href="/wishlist"
                  className="text-sm transition-colors duration-200 text-foreground hover:text-muted-foreground"
                >
                  Wishlist
                </Link>
              </li>
              <li>
                <Link
                  href={getRootUrl(`/login?next=${encodeURIComponent(`/${store.slug}`)}`)}
                  className="text-sm transition-colors duration-200 text-foreground hover:text-muted-foreground"
                >
                  Account
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-medium uppercase tracking-wider mb-4 text-muted-foreground">
              Support & Legal
            </h4>
            <ul className="space-y-3">
              <li>
                <a
                  href={`mailto:hello@vendlyafrica.store?subject=Inquiry for ${store.name}`}
                  className="text-sm transition-colors duration-200 text-foreground hover:text-muted-foreground"
                >
                  Contact Us
                </a>
              </li>
              <li>
                <Link
                  href="/shipping-returns"
                  className="text-sm transition-colors duration-200 text-foreground hover:text-muted-foreground"
                >
                  Shipping & Returns
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy-policy"
                  className="text-sm transition-colors duration-200 text-foreground hover:text-muted-foreground"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-sm transition-colors duration-200 text-foreground hover:text-muted-foreground"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className={`${geistSans.className} text-sm font-medium tracking-wider mb-4 text-muted-foreground`}>
              Updates
            </h4>
            {subscribed ? (
              <p className="text-sm text-foreground">Thanks for subscribing!</p>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-3">
                <Input
                  suppressHydrationWarning
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Your phone number"
                  required
                  className="w-full px-4 py-3 text-sm rounded border border-border bg-background text-foreground transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                />
                <Button
                  suppressHydrationWarning
                  type="submit"
                  className="w-full h-9 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded transition-colors duration-200"
                >
                  Subscribe
                </Button>
              </form>
            )}
          </div>
        </div>

        {/* Social links */}
        <div className="flex justify-center gap-6 mb-8">
          <a
            href="#"
            className="text-muted-foreground hover:text-primary transition-all duration-200 ease-in-out"
            aria-label="Instagram"
          >
            <HugeiconsIcon icon={InstagramIcon} size={16} />
          </a>
          <a
            href="#"
            className="text-muted-foreground hover:text-primary transition-all duration-200 ease-in-out"
            aria-label="Twitter"
          >
            <HugeiconsIcon icon={NewTwitterIcon} size={16} />
          </a>
          <a
            href="#"
            className="text-muted-foreground hover:text-primary transition-all duration-200 ease-in-out"
            aria-label="Facebook"
          >
            <HugeiconsIcon icon={Facebook01Icon} size={16} />
          </a>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 text-center">
          <p className="text-xs text-muted-foreground">
            Powered by{" "}
            <Link
              href="https://vendlyafrica.store"
              className={`${geistSans.className} font-medium text-foreground hover:text-primary transition-all duration-200 ease-in-out`}
              target="_blank"
              rel="noopener noreferrer"
            >
              shopVendly
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
