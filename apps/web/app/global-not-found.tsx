import "@shopvendly/ui/globals.css";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Button } from "@shopvendly/ui/components/button";

export const metadata: Metadata = {
  title: "Shopvendly | Page not found",
  description: "The page you are looking for doesn’t exist or has been moved.",
  robots: { index: false, follow: false },
};

export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body className="min-h-screen bg-linear-to-b from-background via-muted/40 to-background text-foreground antialiased">
        <main className="relative isolate h-dvh overflow-hidden bg-linear-to-b from-background via-muted/40 to-background text-foreground">
          <div className="container mx-auto flex h-dvh items-center justify-center px-4">
            <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-10 rounded-md text-center">
              <div className="flex max-w-lg flex-col items-center gap-6">
                <div className="relative w-full max-w-md">
                  <Image
                    src="/nothing.png"
                    alt="Store not found illustration"
                    width={480}
                    height={320}
                    priority
                    className="h-auto w-full"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link href="/account" className="flex-1 sm:flex-none">
                  <Button className="w-full">Create a store</Button>
                </Link>
                <Link href="/" className="flex-1 sm:flex-none">
                  <Button variant="outline" className="w-full">
                    Explore marketplace
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
