import Link from "next/link";
import type { Metadata } from "next";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@shopvendly/ui/components/accordion";

export const metadata: Metadata = {
  title: "ShopVendly FAQs",
  description:
    "Read answers to common questions about ShopVendly, including storefronts, payments, delivery, and selling on Instagram and TikTok.",
  alternates: { canonical: "/faq" },
};

const faqs = [
  {
    id: "item-1",
    question: "Do I need a website to use ShopVendly?",
    answer:
      "No. ShopVendly creates an instant online storefront for you. You can sell from Instagram, TikTok, and other social channels without building a website from scratch.",
  },
  {
    id: "item-2",
    question: "How does ShopVendly handle orders from Instagram and TikTok?",
    answer:
      "Customers order through your ShopVendly store link. Orders are collected in one admin where you can confirm, track, and manage them easily.",
  },
  {
    id: "item-3",
    question: "How do I receive payments?",
    answer:
      "ShopVendly provides secure checkout links and mobile money payment support so customers can pay easily and your records stay organized.",
  },
  {
    id: "item-4",
    question: "Can I manage delivery with ShopVendly?",
    answer:
      "Yes. Sellers can coordinate delivery from the admin and keep customers updated throughout the order journey.",
  },
  {
    id: "item-5",
    question: "Is ShopVendly hard to set up?",
    answer:
      "No. You can create your storefront and start selling in minutes without coding, custom design work, or technical setup.",
  },
];

export default function FAQPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      <section className="max-w-2xl space-y-4">
        <p className="text-sm font-medium text-primary">FAQs</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Frequently asked questions about ShopVendly
        </h1>
        <p className="text-base text-muted-foreground sm:text-lg">
          Find answers about creating a store, managing orders, receiving payments,
          and selling more effectively through social commerce.
        </p>
      </section>

      <section className="mt-10">
        <Accordion>
          {faqs.map((item) => (
            <AccordionItem key={item.id} value={item.id}>
              <AccordionTrigger className="cursor-pointer py-4 text-left text-sm font-medium hover:no-underline">
                {item.question}
              </AccordionTrigger>
              <AccordionContent>
                <p className="pb-2 text-sm text-muted-foreground">{item.answer}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <section className="mt-10 text-sm text-muted-foreground">
        Need more help?{" "}
        <Link href="/contact" className="font-medium text-primary hover:underline">
          Contact us
        </Link>
      </section>
    </main>
  );
}
