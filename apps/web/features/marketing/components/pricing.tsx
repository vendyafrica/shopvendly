import Link from "next/link"
import { Button } from "@shopvendly/ui/components/button"
import { Card } from "@shopvendly/ui/components/card"
import { HugeiconsIcon } from "@hugeicons/react"
import { CheckmarkSquareFreeIcons } from "@hugeicons/core-free-icons"

const plan = {
  name: "Pro",
  description: "Everything you need to run your social business.",
  price: "UGX 30,000",
  period: "/month",
  trial: "14-day free trial",
  features: [
    "Unlimited orders",
    "Secure checkout links",
    "Delivery booking & tracking",
    "Instant storefront",
    "Marketplace listing",
    "Sales dashboard & insights",
  ],
}

export function Pricing() {
  return (
    <section className="bg-background py-24">
      <div className="mx-auto max-w-3xl px-6 text-center">

        <h2 className="text-4xl font-semibold">
          Simple, transparent pricing
        </h2>

        <p className="text-muted-foreground mt-4 text-lg">
          Start free for 14 days. No setup fees. Cancel anytime.
        </p>

        <div className="mt-12">
          <Card className="p-8 text-left">

            <div>
              <h3 className="text-xl font-medium">
                {plan.name}
              </h3>
              <p className="text-muted-foreground mt-1 text-sm">
                {plan.description}
              </p>
            </div>

            <div className="mt-6">
              <span className="text-4xl font-semibold">
                {plan.price}
              </span>
              <span className="text-muted-foreground">
                {plan.period}
              </span>
              <p className="text-primary mt-2 text-sm font-medium">
                {plan.trial}
              </p>
            </div>

            <ul className="mt-8 space-y-3">
              {plan.features.map((feature) => (
                <li
                  key={feature}
                  className="text-muted-foreground flex items-start gap-2 text-sm"
                >
                  <HugeiconsIcon icon={CheckmarkSquareFreeIcons} className="mt-0.5 size-4 shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>

            <Button className="mt-8 w-full h-11 rounded-full">
              <Link href="/signup">
                Start Free Trial
              </Link>
            </Button>

          </Card>
        </div>

      </div>
    </section>
  )
}