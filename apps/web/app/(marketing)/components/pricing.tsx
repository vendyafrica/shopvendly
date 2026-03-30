import { Button } from '@shopvendly/ui/components/button'
import { Check } from 'lucide-react'
import Link from 'next/link'

const freeTierFeatures = [
    'Up to 20 product listings',
    'Shareable storefront link',
    'MTN & Airtel Money payments',
    'Basic order tracking',
    'Listed on Vendly marketplace',
]

const proTierFeatures = [
    'Unlimited product listings',
    'Delivery partner integration',
    'WhatsApp order notifications',
    'Customer data and history',
    'Store analytics dashboard',
    'Custom store logo and branding',
    'Instagram product sync',
    'Store policies and refund settings',
    'Priority support',
]

export function Pricing() {
    return (
        <section className="bg-[#faf9f7] px-6 py-20 lg:py-28">
            <div className="mx-auto max-w-5xl">
                <div className="mx-auto max-w-2xl space-y-4 text-center">
                    <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">Pricing</p>
                    <h2 className="text-3xl font-semibold lg:text-5xl">Start free. Upgrade when you grow.</h2>
                    <p className="text-muted-foreground text-lg">
                        Simple plans for sellers getting started or ready to grow.
                    </p>
                </div>

                <div className="mx-auto mt-12 grid gap-6 md:grid-cols-2">
                    <div className="rounded-[2rem] border border-border/60 bg-white p-8 shadow-sm lg:p-10">
                        <h3 className="text-xl font-semibold">Free</h3>
                        <p className="mt-3 text-3xl font-semibold">UGX 0 / mo</p>
                        <p className="mt-3 text-sm leading-6 text-muted-foreground">
                            For new sellers who want to start fast.
                        </p>
                        <ul className="mt-6 space-y-3 text-sm text-foreground/90">
                            {freeTierFeatures.map((item, index) => (
                                <li key={index} className="flex items-start gap-2">
                                    <Check className="mt-0.5 size-4 text-primary" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                        <div className="mt-8">
                            <Button className="w-full rounded-full">
                                <Link href="/account">Start for free</Link>
                            </Button>
                        </div>
                    </div>

                    <div className="rounded-[2rem] border border-primary/20 bg-primary/5 p-8 shadow-sm lg:p-10">
                        <div className="inline-flex rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                            Most popular
                        </div>
                        <h3 className="mt-4 text-xl font-semibold">Pro</h3>
                        <p className="mt-3 text-3xl font-semibold">UGX 35,000 / mo</p>
                        <p className="mt-3 text-sm leading-6 text-muted-foreground">
                            For sellers who want more control and more automation.
                        </p>
                        <ul className="mt-6 space-y-3 text-sm text-foreground/90">
                            {proTierFeatures.map((item, index) => (
                                <li key={index} className="flex items-start gap-2">
                                    <Check className="mt-0.5 size-4 text-primary" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                        <div className="mt-8">
                            <Button className="w-full rounded-full">
                                <Link href="/account?plan=pro">Start Pro</Link>
                            </Button>
                        </div>
                    </div>
                </div>

                <p className="mt-8 text-center text-sm text-muted-foreground">
                    Need help choosing?{' '}
                    <Link href="/contact" className="text-primary underline underline-offset-4">
                        Talk to us on WhatsApp.
                    </Link>
                </p>
            </div>
        </section>
    )
}