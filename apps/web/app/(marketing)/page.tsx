import type { Metadata } from "next";
import { FAQs } from "./components/faq";
import { Hero } from "./components/hero";
import { Features } from "./components/features";
import { Pricing } from "./components/pricing";
import { Header } from "./components/header";


export const metadata: Metadata = {
  title: "ShopVendly | Simpler commerce for African stores",
  description:
    "The simpler, cheaper way to run an African store online. Sell, get paid, book delivery, and get discovered from one place.",
  alternates: {
    canonical: "/",
  },
};

export default function LandingPage() {
  return (
    <div className="scroll-smooth">
      <Header />
      <Hero />
      <Features />
      <Pricing/>
      <FAQs />
    </div>
  );
}
