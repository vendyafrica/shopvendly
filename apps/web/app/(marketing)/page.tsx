import type { Metadata } from "next";
import { FAQs } from "./components/faq";
import { Footer } from "./components/footer";
import { Hero } from "./components/hero";
import { Features } from "./components/features";
import { Integrations } from "./components/integrations";
import { Content } from "./components/content";
import { Pricing } from "./components/pricing";
import { Header } from "./components/header";

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
      <Header />
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
