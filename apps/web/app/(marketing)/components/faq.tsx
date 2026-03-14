"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@shopvendly/ui/components/accordion";
import Link from "next/link";

const faqs = [
  {
    id: "item-1",
    question: "Why not just sell on Instagram?",
    answer:
      "Instagram is good for attention, but not for running the whole store. ShopVendly gives you checkout, payments, delivery, and order tracking in one place.",
  },
  {
    id: "item-2",
    question: "Do I need a website first?",
    answer:
      "No. ShopVendly gives you a storefront you can share from Instagram, TikTok, WhatsApp, and anywhere else you sell.",
  },
  {
    id: "item-3",
    question: "How do payments work?",
    answer:
      "Customers pay through your ShopVendly checkout, and your payment records stay tied to the right orders inside your dashboard.",
  },
  {
    id: "item-4",
    question: "Can I manage delivery too?",
    answer:
      "Yes. You can book delivery from your admin, track orders, and keep customers updated without handling everything manually.",
  },
  {
    id: "item-6",
    question: "Who is ShopVendly for?",
    answer:
      "It is for African stores that want something simpler and cheaper than heavy ecommerce tools, with local payments, delivery, and marketplace reach built in.",
  },
];

export function FAQs() {
  return (
    <section className="bg-background @container py-24">
      <div className="mx-auto max-w-3xl px-6">
        <div className="@xl:flex-row @xl:items-start @xl:gap-12 flex flex-col gap-8">
          <div className="@xl:sticky @xl:top-24 @xl:w-64 shrink-0">
            <h2 className="font-serif text-3xl font-medium">Questions</h2>
            <p className="text-muted-foreground mt-3 text-sm">
              Short answers before you create your store.
            </p>
            <p className="text-muted-foreground @xl:block mt-6 hidden text-sm">
              Have questions?{" "}
              <Link
                href="/contact"
                className="text-primary font-medium hover:underline"
              >
                Contact us
              </Link>
            </p>
          </div>
          <div className="flex-1">
            <Accordion>
              {faqs.map((item) => (
                <AccordionItem key={item.id} value={item.id}>
                  <AccordionTrigger className="cursor-pointer py-4 text-sm font-medium hover:no-underline">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-muted-foreground pb-2 text-sm">
                      {item.answer}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            <p className="text-muted-foreground @xl:hidden mt-6 text-sm">
              Have questions?{" "}
              <Link
                href="/contact"
                className="text-primary font-medium hover:underline"
              >
                Contact us
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
