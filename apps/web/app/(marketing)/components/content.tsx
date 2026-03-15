import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@shopvendly/ui/components/button";
import { Card, CardContent } from "@shopvendly/ui/components/card";

const workflowSteps = [
  {
    number: "01",
    title: "Set up your storefront",
    description:
      "Add your products, pricing, and delivery details once, then share a clean storefront link everywhere you sell.",
  },
  {
    number: "02",
    title: "Collect orders and payments",
    description:
      "Turn incoming DMs and link clicks into organized orders with payment tracking that keeps every sale moving.",
  },
  {
    number: "03",
    title: "Fulfill and grow with clarity",
    description:
      "Track delivery progress, follow up less, and use performance insights to keep improving your store.",
  },
];

export function Content() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-4xl px-6 text-center">

        <h2 className="text-4xl font-semibold">
          ShopVendly gives social sellers a simple way to run a real online store
        </h2>

        <p className="text-muted-foreground mt-4 text-lg">
          Create your storefront, share your link, collect orders, accept payments,
          and manage delivery in one place.
        </p>

        <div className="mt-8 flex justify-center gap-4">
          <Button className="h-12 px-8 rounded-full">
            <Link href="/account">
              Create Your Store
            </Link>
          </Button>

          <Button variant="ghost" className="h-12 px-8 rounded-full">
            <Link href="/pricing">
              See Pricing
            </Link>
          </Button>
        </div>

      </div>
    </section>
  );
}