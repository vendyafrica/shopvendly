import type { Metadata } from "next";
import { FAQs } from "@/features/marketing/components/faq";
import { Footer } from "@/features/marketing/components/footer";
import { Hero } from "@/features/marketing/components/hero";
import { Features } from "@/features/marketing/components/features";
import { Integrations } from "@/features/marketing/components/integrations";
import { Content } from "@/features/marketing/components/content";

export const metadata: Metadata = {
  title: "ShopVendly | Build Your Online Shop from Social Media Posts",
  description:
    "Turn Instagram and TikTok into your online store. Instant storefronts, seamless payments, delivery logistics, and marketplace visibility for African sellers.",
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
      <FAQs />
      <Footer />
    </div>
  );
}
