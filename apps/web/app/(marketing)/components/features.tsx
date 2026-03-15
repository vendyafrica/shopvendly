import { Card } from '@shopvendly/ui/components/card'
import { ShoppingBag, Wallet, Truck } from 'lucide-react'

export function Features() {
    return (
        <section>
            <div className="py-24">
                <div className="mx-auto w-full max-w-5xl px-6">
                    <div className="mb-14 max-w-xl">
                        <p className="text-primary text-sm font-medium uppercase tracking-[0.18em]">
                            Why Vendly
                        </p>
                        <h2 className="text-foreground mt-3 text-3xl font-semibold md:text-4xl">
                            Instagram gets the attention. Vendly runs the business behind it.
                        </h2>
                        <p className="text-muted-foreground mt-4 text-lg">
                            Everything that happens after someone says "where do I buy this?" — handled.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">

                        {/* Card 1 — spans full width */}
                        <Card className="col-span-full overflow-hidden p-8">
                            <ShoppingBag className="text-primary size-5" />
                            <h3 className="text-foreground mt-5 text-lg font-semibold">
                                A store that works while you sleep.
                            </h3>
                            <p className="text-muted-foreground mt-3 max-w-xl text-balance">
                                Your Vendly store takes orders, confirms payments, and updates inventory on its own. You post the content — the store handles what comes after.
                            </p>
                            {/* Add your custom image/illustration here */}
                        </Card>

                        {/* Card 2 */}
                        <Card className="col-span-1 overflow-hidden p-8 md:col-span-1 lg:col-span-2">
                            <Wallet className="text-primary size-5" />
                            <h3 className="text-foreground mt-5 text-lg font-semibold">
                                Mobile money, built in from day one.
                            </h3>
                            <p className="text-muted-foreground mt-3 text-balance">
                                Accept MTN and Airtel Money without a third-party workaround. Every payment lands in your dashboard, confirmed, recorded, done.
                            </p>
                            {/* Add your custom image/illustration here */}
                        </Card>

                        {/* Card 3 */}
                        <Card className="col-span-1 overflow-hidden p-8">
                            <Truck className="text-primary size-5" />
                            <h3 className="text-foreground mt-5 text-lg font-semibold">
                                Delivery without the back and forth.
                            </h3>
                            <p className="text-muted-foreground mt-3 text-balance">
                                Book a rider, track the parcel, and keep your customer updated — all from the same place you took the order. No calls. No WhatsApp threads.
                            </p>
                            {/* Add your custom image/illustration here */}
                        </Card>

                    </div>
                </div>
            </div>
        </section>
    )
}