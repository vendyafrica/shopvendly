import type { Metadata } from "next";
import { FAQ } from "@/features/marketing/components/faq";
import Footer from "@/features/marketing/components/footer";
import { Hero } from "@/features/marketing/components/hero";
import { Header } from "@/features/marketing/components/header";
import { Features } from "@/features/marketing/components/features";
import { TasteTransition } from "@/features/marketing/components/taste-transition";
import { Solutions } from "@/features/marketing/components/solutions";

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
    <div className="bg-[#121214] text-white selection:bg-[#5B4BFF] selection:text-white scroll-smooth">
      <Header />
      <Hero />
      <TasteTransition />
      <Features />
      <Solutions />
      <FAQ />
      <Footer />
    </div>
  );
}
