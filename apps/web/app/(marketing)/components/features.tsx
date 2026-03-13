import { Card } from '@shopvendly/ui/components/card'
import { HugeiconsIcon } from '@hugeicons/react'
import { ShoppingBag01Icon, CreditCardIcon, DeliveryTruck01Icon, Store02Icon, Search01Icon, LoginSquare02Icon } from '@hugeicons/core-free-icons'

export function Features() {
  return (
    <section className="py-24">
      <div className="mx-auto w-full max-w-5xl px-6">

        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold md:text-4xl">
            Everything you need to run your <br/> online store from social media.
          </h2>
          <p className="text-muted-foreground mt-4 text-lg">
            Stop managing orders in DMs, payments by screenshot, and delivery by guesswork.
            ShopVendly gives social sellers one simple system to run their store.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">

          {/* Orders */}
          <Card className="space-y-4 p-6">
            <HugeiconsIcon icon={ShoppingBag01Icon} className="size-6" />
            <h3 className="text-xl font-medium">
              Manage Orders in One Place
            </h3>
            <p className="text-muted-foreground">
              Collect orders from Instagram, TikTok, and WhatsApp in one admin.
              Confirm, track, and manage everything without losing sales in DMs.
            </p>
          </Card>

          {/* Payments */}
          <Card className="space-y-4 p-6">
            <HugeiconsIcon icon={CreditCardIcon} className="size-6" />
            <h3 className="text-xl font-medium">
              Simple Payments
            </h3>
            <p className="text-muted-foreground">
              Send secure checkout links and accept payments without the back-and-forth.
              No more manual confirmations or payment screenshots.
            </p>
          </Card>

          {/* Delivery */}
          <Card className="space-y-4 p-6">
            <HugeiconsIcon icon={DeliveryTruck01Icon} className="size-6" />
            <h3 className="text-xl font-medium">
              Delivery Made Easier
            </h3>
            <p className="text-muted-foreground">
              Book delivery, track parcels, and keep customers updated from pickup
              to doorstep.
            </p>
          </Card>

          {/* Storefront */}
          <Card className="space-y-4 p-6">
            <HugeiconsIcon icon={Store02Icon} className="size-6" />
            <h3 className="text-xl font-medium">
              Simple Online Store
            </h3>
            <p className="text-muted-foreground">
              Turn your Instagram, TikTok, or WhatsApp business into a clean,
              shareable online store. No coding. No design work.
            </p>
          </Card>

          <Card className="space-y-4 p-6">
            <HugeiconsIcon icon={Search01Icon} className="size-6" />
            <h3 className="text-xl font-medium">
              Reach More Buyers
            </h3>
            <p className="text-muted-foreground">
              List your products on ShopVendly&apos;s marketplace and reach buyers
              already searching — not just the people who follow you.
            </p>
          </Card>

          {/* Growth Insights */}
          <Card className="space-y-4 p-6">
            <HugeiconsIcon icon={LoginSquare02Icon} className="size-6" />
            <h3 className="text-xl font-medium">
              Clear Business Insights
            </h3>
            <p className="text-muted-foreground">
              Track sales, revenue, and performance in real time so you can make
              better decisions as your business grows.
            </p>
          </Card>

        </div>
      </div>
    </section>
  )
}