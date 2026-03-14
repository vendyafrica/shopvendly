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
            One dashboard for every part of your social store
          </h2>
          <p className="text-muted-foreground mt-4 text-lg">
            No more spreadsheets for orders, screenshots for payments, or WhatsApp chains for delivery.
            ShopVendly keeps the messy parts of selling in one clean place.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">

          {/* Orders */}
          <Card className="space-y-4 p-6">
            <HugeiconsIcon icon={ShoppingBag01Icon} className="size-6" />
            <h3 className="text-xl font-medium">Orders stop living in DMs</h3>
            <p className="text-muted-foreground">
              Pull every Instagram, TikTok, and WhatsApp order into one queue, confirm it, and keep the thread moving without scrolling through messages.
            </p>
          </Card>

          {/* Payments */}
          <Card className="space-y-4 p-6">
            <HugeiconsIcon icon={CreditCardIcon} className="size-6" />
            <h3 className="text-xl font-medium">Payments without screenshots</h3>
            <p className="text-muted-foreground">
              Send a checkout link, get the mobile-money receipt, and mark it paid. No more &quot;did you get it?&quot; follow-ups.
            </p>
          </Card>

          {/* Delivery */}
          <Card className="space-y-4 p-6">
            <HugeiconsIcon icon={DeliveryTruck01Icon} className="size-6" />
            <h3 className="text-xl font-medium">Delivery that actually updates</h3>
            <p className="text-muted-foreground">
              Book a rider, hand off the parcel, and let ShopVendly push updates so customers aren’t blowing up your phone.
            </p>
          </Card>

          {/* Storefront */}
          <Card className="space-y-4 p-6">
            <HugeiconsIcon icon={Store02Icon} className="size-6" />
            <h3 className="text-xl font-medium">A storefront you can drop anywhere</h3>
            <p className="text-muted-foreground">
              Publish products once, share the link everywhere, and let customers browse without DMing you first.
            </p>
          </Card>

          <Card className="space-y-4 p-6">
            <HugeiconsIcon icon={Search01Icon} className="size-6" />
            <h3 className="text-xl font-medium">
              Reach More Buyers
            </h3>
            <p className="text-muted-foreground">
              List your products on ShopVendly and meet buyers who are searching, not just the ones who already follow you.
            </p>
          </Card>

          {/* Growth Insights */}
          <Card className="space-y-4 p-6">
            <HugeiconsIcon icon={LoginSquare02Icon} className="size-6" />
            <h3 className="text-xl font-medium">Know what’s selling</h3>
            <p className="text-muted-foreground">
              Daily numbers show which products move, which channels bring orders, and when you should restock.
            </p>
          </Card>

        </div>
      </div>
    </section>
  )
}