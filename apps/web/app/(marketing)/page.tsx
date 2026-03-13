import type { Metadata } from "next";
import { FAQs } from "./components/faq";
import { Footer } from "./components/footer";
import { Hero } from "./components/hero";
import { Features } from "./components/features";
import { Integrations } from "./components/integrations";
import { Content } from "./components/content";
import { Pricing } from "./components/pricing";

export const metadata: Metadata = {
  title: "ShopVendly | Online Store for Instagram, TikTok & WhatsApp Sellers",
  description:
    "Create a simple online store for your Instagram, TikTok, or WhatsApp business. ShopVendly helps you manage orders, payments, and delivery in one place.",
  alternates: {
    canonical: "/",
  },
};

export default function LandingPage() {
  return (
    <div className="scroll-smooth">
      <Hero />
      <Integrations />
      <Features />
      <Content />
      <Pricing />
      <FAQs />
      <Footer />
    </div>
  );
}
