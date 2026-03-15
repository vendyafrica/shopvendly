export function FAQs() {
    return (
        <section className="scroll-py-16 py-16 md:scroll-py-32 md:py-32">
            <div className="mx-auto max-w-5xl px-6">
                <div className="grid gap-y-12 px-2 lg:grid-cols-[1fr_auto]">
                    <div className="text-center lg:text-left">
                        <h2 className="mb-4 text-3xl font-semibold md:text-4xl">
                            Frequently <br className="hidden lg:block" /> Asked <br className="hidden lg:block" />
                            Questions
                        </h2>
                        <p className="text-muted-foreground">
                            Can&apos;t find your answer? <br className="hidden lg:block" />
                            Message us on WhatsApp.
                        </p>
                    </div>

                    <div className="divide-y divide-dashed sm:mx-auto sm:max-w-lg lg:mx-0">
                        <div className="pb-6">
                            <h3 className="font-medium">Is Vendly really free to start?</h3>
                            <p className="text-muted-foreground mt-4">
                                Yes. You can create your store, list up to 20 products, and start accepting mobile money payments at no cost. No credit card required. You only upgrade when you need more.
                            </p>
                        </div>

                        <div className="py-6">
                            <h3 className="font-medium">How does the student plan work?</h3>
                            <p className="text-muted-foreground mt-4">
                                If you&apos;re a university student with a valid student ID, you get Vendly Pro free for 12 months. Apply with your student email or ID and we&apos;ll activate your account within 24 hours.
                            </p>
                        </div>

                        <div className="py-6">
                            <h3 className="font-medium">Which payment methods does Vendly support?</h3>
                            <p className="text-muted-foreground mt-4">
                                Vendly supports MTN Mobile Money and Airtel Money out of the box. Payments are confirmed automatically — no screenshots, no back and forth.
                            </p>
                        </div>

                        <div className="py-6">
                            <h3 className="font-medium">How does delivery work?</h3>
                            <p className="text-muted-foreground mt-4">
                                On the Pro plan you can connect your preferred delivery partner directly in your dashboard. When an order comes in, Vendly coordinates the pickup. Your customer gets updates automatically.
                            </p>
                        </div>

                        <div className="py-6">
                            <h3 className="font-medium">Is Vendly a marketplace like Jumia?</h3>
                            <p className="text-muted-foreground mt-4">
                                Not exactly. Vendly gives you your own storefront — your brand, your link, your customers. You also get listed on the Vendly marketplace so buyers who don&apos;t follow you can still find you. You own the relationship.
                            </p>
                        </div>

                        <div className="py-6">
                            <h3 className="font-medium">Do I need technical skills to set up my store?</h3>
                            <p className="text-muted-foreground mt-4">
                                No. If you can post on Instagram, you can set up a Vendly store. Most sellers are live in under 10 minutes.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}