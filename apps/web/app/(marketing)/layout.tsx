import type { ReactNode } from "react";
import { Footer } from "./components/footer";
import { Header } from "./components/header";

export default function MarketingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="bg-[#faf9f7] min-h-screen">
      <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8">
        <Header />
      </div>
      {children}
      <Footer />
    </div>
  );
}
