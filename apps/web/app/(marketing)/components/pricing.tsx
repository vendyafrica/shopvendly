import { Button } from '@shopvendly/ui/components/button'
import { Check } from 'lucide-react'
import Link from 'next/link'

export function Pricing() {
    return (
        <section className="bg-[#faf9f7] py-16 md:py-32">
            <div className="mx-auto max-w-5xl px-6">
                <div className="mx-auto max-w-2xl space-y-6 text-center">
                    <h1 className="text-center text-4xl font-semibold lg:text-5xl">
                        One plan for serious growth.
                    </h1>
                    <p className="text-muted-foreground">
                        Everything you need to run a professional social storefront, take payments, and scale operations in one paid plan.
                    </p>
                </div>

                <div className="mx-auto mt-8 max-w-2xl md:mt-20">
                    <div className="dark:bg-muted rounded-(--radius) flex h-full flex-col justify-between border p-6 shadow-lg shadow-gray-950/5 lg:p-10 dark:[--color-muted:var(--color-zinc-900)]">
                        <div className="space-y-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="font-medium">Pro</h2>
                                    <span className="text-primary bg-primary/10 rounded-full px-2 py-0.5 text-xs font-medium">
                                        Best for growing stores
                                    </span>
                                </div>
                                <span className="my-3 block text-2xl font-semibold">UGX 35,000 / mo</span>
                                <p className="text-muted-foreground text-sm">
                                    For sellers who want advanced tools, stronger branding, and faster operations.
                                </p>
                            </div>
                            <div className="text-sm font-medium">What&apos;s included:</div>
                            <ul className="list-outside space-y-3 text-sm">
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

                        <div className="mt-8">
                            <Button className="w-full">
                                <Link href="/signup?plan=pro">Start Pro</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}