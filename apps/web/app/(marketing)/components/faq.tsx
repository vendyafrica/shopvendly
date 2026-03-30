import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@shopvendly/ui/components/accordion"
import { Card } from "@shopvendly/ui/components/card"
import Link from "next/link"

const faqs = [
    {
        id: "free",
        question: "Can I start without paying?",
        answer:
            "Yes. You can create your store, publish products, and begin taking orders on the free plan. Upgrade only when you need more room to grow.",
    },
    {
        id: "student-plan",
        question: "Do I need technical skills to set up my store?",
        answer:
            "No. If you can post on WhatsApp or Instagram, you can set up a store and start selling. Most people go live quickly.",
    },
    {
        id: "payments",
        question: "How do customers pay?",
        answer:
            "Customers can pay with mobile money through the storefront flow. Payments are confirmed automatically, so you do not have to chase screenshots.",
    },
    {
        id: "delivery",
        question: "How does delivery work?",
        answer:
            "You can arrange physical delivery for products or automate delivery for digital items like tickets, files, and course access.",
    },
    {
        id: "marketplace",
        question: "Is this a marketplace or my own store?",
        answer:
            "You get your own storefront and your own link. Discovery can happen through the platform, but the store still belongs to you.",
    },
    {
        id: "technical",
        question: "Can I use it from WhatsApp and social media?",
        answer:
            "Yes. The flow is built for sellers who already use WhatsApp, Instagram, TikTok, and direct chat to move products.",
    },
]

export function FAQs() {
    return (
        <section className="bg-background @container py-24">
            <div className="mx-auto max-w-2xl px-6">
                <div className="text-center">
                    <h2 className="text-balance text-4xl font-medium">
                        Frequently Asked Questions
                    </h2>
                    <p className="text-muted-foreground mx-auto mt-4 max-w-md text-balance">
                        Find answers to common questions about our platform.
                    </p>
                </div>
                <Card className="mt-12 overflow-hidden p-0">
                    <Accordion>
                        {faqs.map((faq) => (
                            <AccordionItem
                                key={faq.id}
                                value={faq.id}
                                className="border-b px-6 last:border-b-0"
                            >
                                <AccordionTrigger className="cursor-pointer py-5 text-sm font-medium hover:no-underline">
                                    {faq.question}
                                </AccordionTrigger>
                                <AccordionContent>
                                    <p className="text-muted-foreground pb-5 text-sm">
                                        {faq.answer}
                                    </p>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </Card>
                <p className="text-muted-foreground mt-6 text-center text-sm">
                    Still have questions?{' '}
                    <Link href="/contact" className="text-primary font-medium hover:underline">
                        Contact support
                    </Link>
                </p>
            </div>
        </section>
    )
}