import { MarketplaceGridSkeleton } from "@/app/(marketplace)/components/marketplace-grid-skeleton";
import Header from "@/app/(marketplace)/components/header";
import Footer from "@/app/(marketplace)/components/footer";

export default function Loading() {
  return (
    <main className="min-h-screen bg-white">
      <Header />

      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {Array.from({ length: 3 }).map((_, index) => (
          <section key={index} className="mb-12">
            <div className="ml-9 mb-4">
              <div className="h-8 w-32 bg-muted rounded animate-pulse" />
            </div>
            <MarketplaceGridSkeleton />
          </section>
        ))}
      </div>

      <Footer />
    </main>
  );
}
