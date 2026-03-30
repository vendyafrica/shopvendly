import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@shopvendly/ui/components/accordion"

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

const defaultFaqId = faqs[0]?.id

export function FAQs() {
    return (
        <section className="bg-[#faf9f7] scroll-py-16 py-16 md:scroll-py-32 md:py-32">
            <div className="mx-auto max-w-5xl px-6">
                <div className="grid gap-y-12 px-2 lg:grid-cols-[1fr_auto]">
                    <div className="text-center lg:text-left">
                        <h2 className="mb-4 text-3xl font-semibold md:text-4xl">
                            Questions people ask
                        </h2>
                        <p className="text-muted-foreground">
                            If you still need help, message us on WhatsApp.
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