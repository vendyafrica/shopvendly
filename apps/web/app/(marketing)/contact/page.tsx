import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@shopvendly/ui/components/button";

export const metadata: Metadata = {
  title: "Contact ShopVendly",
  description:
    "Contact ShopVendly for help with your online store, onboarding, payments, delivery workflows, or general questions about the platform.",
  alternates: { canonical: "/contact" },
};

const supportEmail = "support@shopvendly.store";

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      <section className="max-w-2xl space-y-4">
        <p className="text-sm font-medium text-primary">Contact</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Talk to the ShopVendly team
        </h1>
        <p className="text-base text-muted-foreground sm:text-lg">
          Reach out if you need help getting started, setting up your storefront,
          understanding pricing, or using ShopVendly to sell online.
        </p>
      </section>

      <section className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border bg-card p-6">
          <h2 className="text-xl font-semibold">Email support</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            For onboarding help, account questions, or platform support, email us
            and we will point you in the right direction.
          </p>
          <p className="mt-4 text-sm">
            <Link href={`mailto:${supportEmail}`} className="font-medium text-primary hover:underline">
              {supportEmail}
            </Link>
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-6">
          <h2 className="text-xl font-semibold">Useful links</h2>
          <div className="mt-4 flex flex-col gap-3 text-sm">
            <Link href="/pricing" className="text-primary hover:underline">View pricing</Link>
            <Link href="/faq" className="text-primary hover:underline">Read FAQs</Link>
            <Link href="/about" className="text-primary hover:underline">Learn about ShopVendly</Link>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <Button className="h-11 w-full rounded-full px-6 sm:w-auto">
          <Link href="/account">Create Your Store</Link>
        </Button>
      </section>
    </main>
  );
}
