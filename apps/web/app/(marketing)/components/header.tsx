import { Button } from "@/src/components/button";
import Image from "next/image";
import Link from "next/link";

const navItems = [
  { label: "About", href: "/about" },
  { label: "Pricing", href: "/pricing" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
  // { label: "Marketplace", href: "/m" },
];

export function Header() {
  return (
    <header className="flex items-center justify-between gap-6">
      <Link
        href="/"
        className="flex items-center text-2xl font-bold text-foreground"
      >
        <Image
          src="/vendly.png"
          alt="ShopVendly icon"
          width={28}
          height={28}
          className="mr-2"
        />
        <span className="text-black/80">vend</span>
        <span className="text-primary">ly</span>
      </Link>

      <nav className="items-center gap-8 text-sm font-medium flex">
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

      <div className="flex items-center gap-3">
        <Button variant="ghost" className="rounded-full px-7 border border-black/70">
          Login
        </Button>
      </div>
    </header>
  );
}
