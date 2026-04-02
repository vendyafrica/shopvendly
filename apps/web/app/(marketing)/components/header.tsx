"use client";

import { useState } from "react";
import { Button } from "@/src/components/button";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const navItems = [
  { label: "About", href: "/about" },
  { label: "Pricing", href: "/pricing" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
  { label: "Marketplace", href: "/m" },
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
      <div className="flex items-center justify-between gap-4 rounded-full px-4 py-3 text-white sm:px-5">
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          <Link href="/" aria-label="Go to homepage" className="inline-flex shrink-0">
            <Image
              src="/vendly.png"
              alt="vendly logo"
              width={28}
              height={28}
            />
          </Link>
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-white/85 transition hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Button
            variant="ghost"
            className="h-10 rounded-md border cursor-pointer border-white/15 bg-primary px-6 hover:text-white text-sm text-white font-bold shadow-none hover:bg-primary/90"
          >
            <Link href={loginHref}>Login</Link>
          </Button>
        </div>

        <button
          type="button"
          aria-expanded={isMenuOpen}
          aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white shadow-sm transition hover:bg-white/15 md:hidden"
          onClick={handleMenuToggle}
        >
          {isMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {isMenuOpen ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-3 rounded-3xl border border-white/10 bg-black/80 p-3 text-white shadow-xl shadow-black/25 backdrop-blur-md md:hidden">
          <nav className="flex flex-col">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="rounded-2xl px-4 py-3 text-sm font-medium text-white/90 transition hover:bg-white/10 hover:text-white"
                onClick={handleMenuClose}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-3">
            <Button
              variant="ghost"
              className="w-full rounded-md border border-white/20 bg-primary px-7 text-white hover:bg-white/15"
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
