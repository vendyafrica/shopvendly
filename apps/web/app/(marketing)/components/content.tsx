import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@shopvendly/ui/components/button";
import { Card, CardContent } from "@shopvendly/ui/components/card";

const workflowSteps = [
  {
    number: "01",
    title: "Build your store",
    description:
      "Add your products, set your prices, upload your photos. Your store looks like your brand — not a template. Takes less than 10 minutes.",
  },
  {
    number: "02",
    title: "Share your link",
    description:
      "You get one clean link. Drop it in your WhatsApp bio, Instagram, TikTok, wherever your customers already are. They click, they shop.",
  },
  {
    number: "03",
    title: "Get paid. Deliver. Repeat.",
    description:
      "Customers pay with mobile money. You get notified. You book delivery straight from your dashboard. That's it. No spreadsheets. No chaos.",
  },
];

export function Content() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-4xl px-6 text-center">

        <p className="text-primary text-sm font-medium uppercase tracking-[0.18em]">
          How it works
        </p>

        <h2 className="mt-3 text-4xl font-semibold">
          Live in minutes. Selling by tonight.
        </h2>

        <p className="text-muted-foreground mt-4 text-lg">
          If you can post on Instagram, you can run a Vendly store.
          No tech skills. No designer. No nonsense.
        </p>

        <div className="mt-16 grid gap-8 text-left sm:grid-cols-3">
          {workflowSteps.map((step) => (
            <div key={step.number} className="flex flex-col gap-3">
              <span className="text-primary text-4xl font-bold leading-none">
                {step.number}
              </span>
              <h3 className="text-lg font-semibold">{step.title}</h3>
              <p className="text-muted-foreground text-sm leading-6">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 flex justify-center gap-4">
          <Button className="h-12 px-8 rounded-full">
            <Link href="/account">
              Start for free
            </Link>
          </Button>

          <Button variant="outline" className="h-12 px-8 text-primary rounded-full">
            <Link href="/pricing">
              See pricing
            </Link>
          </Button>
        </div>

      </div>
    </section>
  );
}