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
    question: "Do I need a website to use Vendly?",
    answer:
      "No. Vendly creates an instant storefront for you. You can sell directly from Instagram, TikTok, and WhatsApp without building a website.",
  },
  {
    id: "item-2",
    question: "How does Vendly handle orders from Instagram and TikTok?",
    answer:
      "Customers place orders through your Vendly store link. All orders appear in one admin where you can confirm, track, and manage them easily.",
  },
  {
    id: "item-3",
    question: "How do I receive payments?",
    answer:
      "Vendly provides secure checkout links for your customers. Payments are processed instantly and recorded automatically in your admin.",
  },
  {
    id: "item-4",
    question: "Do you handle delivery?",
    answer:
      "Yes. You can book delivery directly from your admin and track parcels in real time. Customers also receive delivery updates automatically.",
  },
  {
    id: "item-6",
    question: "Is Vendly hard to set up?",
    answer:
      "No. You can create your storefront and start selling in minutes. No coding, design, or technical knowledge required.",
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
              Your questions answered
            </p>
            <p className="text-muted-foreground @xl:block mt-6 hidden text-sm">
              Need more help?{" "}
              <Link
                href="#"
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
                href="#"
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
