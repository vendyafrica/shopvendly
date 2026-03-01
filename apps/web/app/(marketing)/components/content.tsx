import { Button } from "@shopvendly/ui/components/button"
import Link from "next/link"

export function Content() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-4xl px-6 text-center">

        <h2 className="text-4xl font-semibold">
          Ready to run your business the easy way?
        </h2>

        <p className="text-muted-foreground mt-4 text-lg">
          Join sellers turning Instagram and TikTok into organized,
          profitable storefronts.
        </p>

        <div className="mt-8 flex justify-center gap-4">
          <Button className="h-12 px-8 rounded-full">
            <Link href="/c">
              Get Started
            </Link>
          </Button>

          <Button variant="ghost" className="h-12 px-8 rounded-full">
            <Link href="https://vendly.shopvendly.store/">
              View Demo
            </Link>
          </Button>
        </div>

      </div>
    </section>
  )
}