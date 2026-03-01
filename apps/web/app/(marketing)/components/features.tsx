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
            Everything you need to run your <br/> social business in one place.
          </h2>
          <p className="text-muted-foreground mt-4 text-lg">
            Stop juggling DMs, payment screenshots, spreadsheets, and delivery riders.
            Vendly organizes your entire operation into one simple system.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">

          {/* Orders */}
          <Card className="space-y-4 p-6">
            <HugeiconsIcon icon={ShoppingBag01Icon} className="size-6" />
            <h3 className="text-xl font-medium">
              All Orders in One admin
            </h3>
            <p className="text-muted-foreground">
              Capture Instagram and TikTok inquiries automatically. Confirm,
              track, and manage every order without losing messages in DMs.
            </p>
          </Card>

          {/* Payments */}
          <Card className="space-y-4 p-6">
            <HugeiconsIcon icon={CreditCardIcon} className="size-6" />
            <h3 className="text-xl font-medium">
              Seamless Payments
            </h3>
            <p className="text-muted-foreground">
              Send secure checkout links and get paid instantly.
              No more manual confirmations or payment screenshots.
            </p>
          </Card>

          {/* Delivery */}
          <Card className="space-y-4 p-6">
            <HugeiconsIcon icon={DeliveryTruck01Icon} className="size-6" />
            <h3 className="text-xl font-medium">
              Automated Delivery
            </h3>
            <p className="text-muted-foreground">
              Book delivery, track parcels, and update customers automatically —
              from pickup to doorstep.
            </p>
          </Card>

          {/* Storefront */}
          <Card className="space-y-4 p-6">
            <HugeiconsIcon icon={Store02Icon} className="size-6" />
            <h3 className="text-xl font-medium">
              Instant Storefront
            </h3>
            <p className="text-muted-foreground">
              Turn your social profile into a clean, shareable online store.
              No coding. No design work.
            </p>
          </Card>

          {/* Discovery */}
          <Card className="space-y-4 p-6">
            <HugeiconsIcon icon={Search01Icon} className="size-6" />
            <h3 className="text-xl font-medium">
              Marketplace Discovery
            </h3>
            <p className="text-muted-foreground">
              List your products on shopvendly&apos;s marketplace and reach buyers
              actively searching — not just your followers.
            </p>
          </Card>

          {/* Growth Insights */}
          <Card className="space-y-4 p-6">
            <HugeiconsIcon icon={LoginSquare02Icon} className="size-6" />
            <h3 className="text-xl font-medium">
              Simple Business Insights
            </h3>
            <p className="text-muted-foreground">
              Track sales, revenue, and performance in real time —
              so you can grow with clarity.
            </p>
          </Card>

        </div>
      </div>
    </section>
  )
}