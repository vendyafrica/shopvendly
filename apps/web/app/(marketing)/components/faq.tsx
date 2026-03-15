import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@shopvendly/ui/components/accordion"

const faqs = [
    {
        id: "free",
        question: "Is Vendly really free to start?",
        answer:
            "Yes. You can create your store, list up to 20 products, and start accepting mobile money payments at no cost. No credit card required. You only upgrade when you need more.",
    },
    {
        id: "student-plan",
        question: "How does the student plan work?",
        answer:
            "If you're a university student with a valid student ID, you get Vendly Pro free for 12 months. Apply with your student email or ID and we'll activate your account within 24 hours.",
    },
    {
        id: "payments",
        question: "Which payment methods does Vendly support?",
        answer:
            "Vendly supports MTN Mobile Money and Airtel Money out of the box. Payments are confirmed automatically — no screenshots, no back and forth.",
    },
    {
        id: "delivery",
        question: "How does delivery work?",
        answer:
            "On the Pro plan you can connect your preferred delivery partner directly in your dashboard. When an order comes in, Vendly coordinates the pickup. Your customer gets updates automatically.",
    },
    {
        id: "marketplace",
        question: "Is Vendly a marketplace like Jumia?",
        answer:
            "Not exactly. Vendly gives you your own storefront — your brand, your link, your customers. You also get listed on the Vendly marketplace so buyers who don't follow you can still find you. You own the relationship.",
    },
    {
        id: "technical",
        question: "Do I need technical skills to set up my store?",
        answer:
            "No. If you can post on Instagram, you can set up a Vendly store. Most sellers are live in under 10 minutes.",
    },
]

const defaultFaqId = faqs[0]?.id

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

                    <Accordion
                        multiple
                        defaultValue={defaultFaqId ? [defaultFaqId] : undefined}
                        className="sm:mx-auto sm:max-w-lg lg:mx-0"
                    >
                        {faqs.map((faq) => (
                            <AccordionItem key={faq.id} value={faq.id} className="py-4">
                                <AccordionTrigger className="text-base font-medium">
                                    {faq.question}
                                </AccordionTrigger>
                                <AccordionContent className="text-muted-foreground text-sm">
                                    <p>{faq.answer}</p>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            </div>
        </section>
    )
}