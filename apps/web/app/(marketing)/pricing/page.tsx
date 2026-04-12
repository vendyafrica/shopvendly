import { Pricing as PricingSection } from "@/modules/marketing/components/pricing";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing | Vendly",
  description:
    "Start free for 30 days. Upgrade anytime for advanced features and priority support.",
  alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
  return <PricingSection />;
}
