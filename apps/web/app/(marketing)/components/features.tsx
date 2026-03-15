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
                            Turn social media interest into paid orders without chasing people in DMs.
                        </h2>
                        <p className="text-muted-foreground mt-4 text-lg">
                            Publish products, collect mobile money, and coordinate delivery from one storefront built for sellers who grow on Instagram, TikTok, and WhatsApp.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">

                        {/* Card 1 — spans full width */}
                        <Card className="col-span-full overflow-hidden p-8">
                            <ShoppingBag className="text-primary size-5" />
                            <h3 className="text-foreground mt-5 text-lg font-semibold">
                                Publish once. Keep selling all day.
                            </h3>
                            <p className="text-muted-foreground mt-3 max-w-xl text-balance">
                                Share one Vendly link in your bio and let customers browse products, place orders, and check out without waiting for a reply. Your inventory and orders stay updated automatically.
                            </p>
                            {/* Add your custom image/illustration here */}
                        </Card>

                        {/* Card 2 */}
                        <Card className="col-span-1 overflow-hidden p-8 md:col-span-1 lg:col-span-2">
                            <Wallet className="text-primary size-5" />
                            <h3 className="text-foreground mt-5 text-lg font-semibold">
                                Charge mobile money like a real business.
                            </h3>
                            <p className="text-muted-foreground mt-3 text-balance">
                                Accept MTN and Airtel Money directly from your storefront. Every payment is tracked, confirmed, and tied to the right order so you can stop relying on screenshots and manual follow-up.
                            </p>
                            {/* Add your custom image/illustration here */}
                        </Card>

                        {/* Card 3 */}
                        <Card className="col-span-1 overflow-hidden p-8">
                            <Truck className="text-primary size-5" />
                            <h3 className="text-foreground mt-5 text-lg font-semibold">
                                Dispatch delivery without the chaos.
                            </h3>
                            <p className="text-muted-foreground mt-3 text-balance">
                                Move from paid order to delivered package faster. Manage fulfillment, track dispatch, and keep customers updated from the same dashboard you use to sell.
                            </p>
                            {/* Add your custom image/illustration here */}
                        </Card>

                    </div>
                </div>
            </div>
        </section>
    )
}