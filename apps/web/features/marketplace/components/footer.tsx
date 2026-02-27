"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@shopvendly/ui/components/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  InstagramIcon,
  WhatsappBusinessIcon,
} from "@hugeicons/core-free-icons";
import { Bricolage_Grotesque } from "next/font/google";

const geistSans = Bricolage_Grotesque({
  variable: "--font-bricolage-grotesque",
  subsets: ["latin"],
});

const footerLinks = [
  {
    title: "Shop",
    links: [
      { name: "Trending", href: "/category/trending" },
      { name: "Track an Order", href: "/track-order" },
      { name: "Customer Service", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Terms of Service", href: "/terms" },
    ],
  },
];

const socialLinks = [
  {
    icon: WhatsappBusinessIcon,
    href: "https://wa.me/254757767916",
    label: "WhatsApp",
  },
  {
    icon: InstagramIcon,
    href: "https://www.instagram.com/vendlyafrica",
    label: "Instagram",
  },
];

export default function Footer() {

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Image
                src="/vendly.png"
                alt="Vendly"
                width={32}
                height={32}
                priority
              />
              <span className= {`${geistSans.className} text-base font-semibold tracking-tight`}>
                vendly
              </span>
            </div>

            <p className="text-sm text-muted-foreground max-w-sm mb-6">
              Vendly gives creators and small businesses online
              storefronts to sell anywhere.
            </p>

            <div className="flex gap-3">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <Button
                  key={label}
                  variant="ghost"
                  size="icon-sm"
                  aria-label={label}
                >
                  <Link href={href} target="_blank">
                    <HugeiconsIcon icon={Icon} className="h-5 w-5" />
                  </Link>
                </Button>
              ))}
            </div>
          </div>

          {footerLinks.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold mb-4">
                {section.title}
              </h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-border mt-12 pt-8 grid grid-cols-1 gap-4 md:grid-cols-2 md:items-center">
          <p className={`${geistSans.className} text-sm text-muted-foreground md:justify-self-start`}>
           Powered by Vendly.
          </p>

          <p className={`${geistSans.className} text-sm text-muted-foreground text-center md:justify-self-end`}>
           Built with 💓
          </p>
        </div>
      </div>
    </footer>
  );
}
