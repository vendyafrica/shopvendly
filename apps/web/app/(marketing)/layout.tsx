import type { ReactNode } from "react";
import { Footer } from "@/modules/marketing/components/footer";
import { Header } from "@/modules/marketing/components/header";

export default function MarketingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="relative bg-[#faf9f7] min-h-screen">
      <div className="absolute inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Header />
        </div>
      </div>
      {children}
      <Footer />
    </div>
  );
}
