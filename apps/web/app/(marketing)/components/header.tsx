"use client";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Menu, X } from "lucide-react";
import { Button } from "@shopvendly/ui/components/button";
import React from "react";
import { cn } from "@shopvendly/ui/lib/utils";

const menuItems = [
  { name: "Features", href: "#features" },
  { name: "How it works", href: "#solution" },
  { name: "Pricing", href: "#pricing" },
  { name: "FAQs", href: "#faqs" },
];

export const Header = () => {
  const [menuState, setMenuState] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  return (
    <header>
      <nav
        data-state={menuState && "active"}
        className="fixed inset-x-0 top-0 z-30 px-3 pt-3"
      >
        <div
          className={cn(
            "mx-auto max-w-6xl rounded-2xl border border-transparent px-5 transition-all duration-300 sm:px-6 lg:px-8",
            isScrolled &&
              "max-w-5xl border-border/60 bg-background/80 shadow-lg shadow-black/5 backdrop-blur-xl",
          )}
        >
          <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
            <div className="flex w-full justify-between lg:w-auto">
              <Link
                href="/"
                aria-label="home"
                className="flex items-center gap-3"
              >
                <Image
                  src="/vendly.png"
                  alt="ShopVendly"
                  width={32}
                  height={32}
                />
                <div className="hidden sm:block">
                  <p className="text-sm font-semibold tracking-tight">ShopVendly</p>
                  <p className="text-xs text-muted-foreground">Social commerce OS</p>
                </div>
              </Link>

              <button
                onClick={() => setMenuState(!menuState)}
                aria-label={menuState == true ? "Close Menu" : "Open Menu"}
                className="relative z-20 -m-2.5 -mr-2 block cursor-pointer rounded-full p-2.5 transition-colors hover:bg-muted lg:hidden"
              >
                <Menu className="in-data-[state=active]:rotate-180 in-data-[state=active]:scale-0 in-data-[state=active]:opacity-0 m-auto size-6 duration-200" />
                <X className="in-data-[state=active]:rotate-0 in-data-[state=active]:scale-100 in-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200" />
              </button>
            </div>

            <div className="absolute inset-0 m-auto hidden size-fit lg:block">
              <ul className="flex items-center gap-8 text-sm">
                {menuItems.map((item, index) => (
                  <li key={index}>
                    <Link
                      href={item.href}
                      className="text-muted-foreground hover:text-foreground block font-medium duration-150"
                    >
                      <span>{item.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-background/95 in-data-[state=active]:block lg:in-data-[state=active]:flex mb-4 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border border-border/60 p-6 shadow-2xl shadow-zinc-300/20 backdrop-blur-xl md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-3 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none dark:shadow-none dark:lg:bg-transparent">
              <div className="lg:hidden">
                <ul className="space-y-6 text-base">
                  {menuItems.map((item, index) => (
                    <li key={index}>
                      <Link
                        href={item.href}
                        className="text-muted-foreground hover:text-foreground block font-medium duration-150"
                        onClick={() => setMenuState(false)}
                      >
                        <span>{item.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn("h-9 rounded-full px-4", isScrolled && "lg:hidden")}
                >
                  <Link href="/account/sign-in">
                    <span>Login</span>
                  </Link>
                </Button>
                <Button
                  size="sm"
                  className={cn("h-9 rounded-full px-4 shadow-sm", isScrolled && "lg:hidden")}
                >
                  <Link href="/account">
                    <span>Start free</span>
                  </Link>
                </Button>
                <Button
                  size="sm"
                  className={cn("hidden h-9 rounded-full px-4 lg:items-center lg:gap-2", isScrolled && "lg:inline-flex")}
                >
                  <Link href="/account" className="inline-flex items-center gap-2">
                    <span>Get Started</span>
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};
