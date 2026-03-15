import { Button } from '@shopvendly/ui/components/button'
import { Check } from 'lucide-react'
import Link from 'next/link'

export function Pricing() {
    return (
        <section className="py-16 md:py-32">
            <div className="mx-auto max-w-5xl px-6">
                <div className="mx-auto max-w-2xl space-y-6 text-center">
                    <h1 className="text-center text-4xl font-semibold lg:text-5xl">
                        Start free. Grow on your terms.
                    </h1>
                    <p className="text-muted-foreground">
                        No setup fees. No hidden costs. Pay only when your business is ready to scale.
                    </p>
                </div>

                <div className="mt-8 grid gap-6 md:mt-20 md:grid-cols-5 md:gap-0">
                    {/* Free Plan */}
                    <div className="rounded-(--radius) flex flex-col justify-between space-y-8 border p-6 md:col-span-2 md:my-2 md:rounded-r-none md:border-r-0 lg:p-10">
                        <div className="space-y-4">
                            <div>
                                <h2 className="font-medium">Free</h2>
                                <span className="my-3 block text-2xl font-semibold">UGX 0 / mo</span>
                                <p className="text-muted-foreground text-sm">
                                    For anyone getting started. No card required.
                                </p>
                            </div>

                            <Button variant="outline" className="w-full">
                                <Link href="/signup">Get Started Free</Link>
                            </Button>

                            <hr className="border-dashed" />

                            <ul className="list-outside space-y-3 text-sm">
                                {[
                                    'Your own Vendly storefront link',
                                    'Up to 20 product listings',
                                    'Mobile money checkout',
                                    'Order and inventory tracking',
                                    'Vendly marketplace listing',
                                ].map((item, index) => (
                                    <li key={index} className="flex items-center gap-2">
                                        <Check className="size-3" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Pro Plan */}
                    <div className="dark:bg-muted rounded-(--radius) border p-6 shadow-lg shadow-gray-950/5 md:col-span-3 lg:p-10 dark:[--color-muted:var(--color-zinc-900)]">
                        <div className="grid gap-6 sm:grid-cols-2">
                            <div className="space-y-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="font-medium">Pro</h2>
                                        <span className="text-primary bg-primary/10 rounded-full px-2 py-0.5 text-xs font-medium">
                                            Free for students
                                        </span>
                                    </div>
                                    <span className="my-3 block text-2xl font-semibold">UGX 35,000 / mo</span>
                                    <p className="text-muted-foreground text-sm">
                                        Students with a valid university ID get Pro free for 12 months.
                                    </p>
                                </div>

                                <Button className="w-full">
                                    <Link href="/signup?plan=pro">Get Started</Link>
                                </Button>

                                <Button variant="outline" className="w-full">
                                    <Link href="/students">Apply for Student Access</Link>
                                </Button>
                            </div>

                            <div>
                                <div className="text-sm font-medium">Everything in Free, plus:</div>
                                <ul className="mt-4 list-outside space-y-3 text-sm">
                                    {[
                                        'Unlimited product listings',
                                        'Delivery partner integration',
                                        'WhatsApp order notifications',
                                        'Customer data and history',
                                        'Store analytics dashboard',
                                        'Custom store logo and branding',
                                        'Instagram product sync',
                                        'Store policies and refund settings',
                                        'Priority support',
                                    ].map((item, index) => (
                                        <li key={index} className="flex items-center gap-2">
                                            <Check className="size-3" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}