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
    question: "Do I need a website to use ShopVendly?",
    answer:
      "No. ShopVendly gives you a simple online store for your Instagram, TikTok, or WhatsApp business without building a website from scratch.",
  },
  {
    id: "item-2",
    question: "How does ShopVendly handle orders from Instagram and TikTok?",
    answer:
      "Customers order through your ShopVendly store link, and every order appears in one admin where you can confirm, track, and manage it easily.",
  },
  {
    id: "item-3",
    question: "How do I receive payments?",
    answer:
      "ShopVendly provides secure checkout links so customers can pay easily, and your payment records stay organized in one place.",
  },
  {
    id: "item-4",
    question: "Do you handle delivery?",
    answer:
      "Yes. You can book delivery directly from your admin and track parcels in real time. Customers also receive delivery updates automatically.",
  },
  {
    id: "item-6",
    question: "Is ShopVendly hard to set up?",
    answer:
      "No. You can create your storefront and start selling in minutes without coding, design work, or technical complexity.",
  },
];

export function FAQs() {
  return (
    <section className="bg-background @container py-24">
      <div className="mx-auto max-w-3xl px-6">
        <div className="@xl:flex-row @xl:items-start @xl:gap-12 flex flex-col gap-8">
          <div className="@xl:sticky @xl:top-24 @xl:w-64 shrink-0">
            <h2 className="font-serif text-3xl font-medium">FAQs</h2>
            <p className="text-muted-foreground mt-3 text-sm">
              Answers for social sellers and growing businesses
            </p>
            <p className="text-muted-foreground @xl:block mt-6 hidden text-sm">
              Need more help?{" "}
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
              Need more help?{" "}
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
