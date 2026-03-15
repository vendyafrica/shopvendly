"use client";

import { useState } from "react";
import { Button } from "@/src/components/button";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const navItems = [
  { label: "About", href: "/about" },
  { label: "Pricing", href: "/pricing" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
  // { label: "Marketplace", href: "/m" },
];

const loginHref = "/account";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleMenuToggle = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const handleMenuClose = () => {
    setIsMenuOpen(false);
  };

  return (
    <header className="relative z-40">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/"
          className="flex min-w-0 items-center text-2xl font-bold text-foreground"
          onClick={handleMenuClose}
        >
          <Image
            src="/vendly.png"
            alt="ShopVendly icon"
            width={28}
            height={28}
            className="mr-2 shrink-0"
          />
          <span className="truncate text-black/80">vend</span>
          <span className="shrink-0 text-primary">ly</span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium sm:flex">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="transition hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 sm:flex">
          <Button
            variant="ghost"
            className="rounded-full border border-black/70 px-7"
          >
            <Link href={loginHref}>Login</Link>
          </Button>
        </div>

        <button
          type="button"
          aria-expanded={isMenuOpen}
          aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white text-foreground shadow-sm transition hover:border-black/20 sm:hidden"
          onClick={handleMenuToggle}
        >
          {isMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {isMenuOpen ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-3 rounded-3xl border border-black/10 bg-white p-3 shadow-xl shadow-black/10 sm:hidden">
          <nav className="flex flex-col">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="rounded-2xl px-4 py-3 text-sm font-medium text-foreground transition hover:bg-primary/5 hover:text-primary"
                onClick={handleMenuClose}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-3">
            <Button
              variant="ghost"
              className="w-full rounded-full border border-black/70 px-7"
            >
              <Link href={loginHref} onClick={handleMenuClose}>
                Login
              </Link>
            </Button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
