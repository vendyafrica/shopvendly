import { Pricing as PricingSection } from "../components/pricing";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Start free with ShopVendly and upgrade when your store needs more tools, branding, and delivery workflows.",
  alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
  return <PricingSection />;
}
