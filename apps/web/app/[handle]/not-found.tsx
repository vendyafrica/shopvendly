import Link from "next/link";
import { Button } from "@shopvendly/ui/components/button";

export default function NotFound() {
  return (
    <main className="min-h-[70vh] bg-background text-foreground">
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-xl text-center">
          <h1 className="text-3xl font-semibold tracking-tight">Store not found</h1>
          <p className="mt-3 text-muted-foreground">
            This store doesn’t exist yet (or the link is incorrect). If you’re trying to start a store, you can create one now.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link href="/account">
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
