import Link from "next/link";
import { Button } from "@shopvendly/ui/components/button";

export default function NotFound() {
  return (
    <main className="min-h-[70vh] bg-background text-foreground">
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-xl text-center">
          <h1 className="text-3xl font-semibold tracking-tight">We’re working on this category</h1>
          <p className="mt-3 text-muted-foreground">
            Stores for this category will appear here soon. In the meantime, you can start selling on Vendly.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link href="/c">
              <Button>Sell now</Button>
            </Link>
            <Link href="/">
              <Button variant="outline">Back home</Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
