"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { Sheet, SheetContent } from "@shopvendly/ui/components/sheet";
import { Input } from "@shopvendly/ui/components/input";

interface SearchModalProps {
  storeSlug: string;
  isOpen: boolean;
  onClose: () => void;
}

type StorefrontProduct = {
  id: string;
  slug: string;
  name: string;
  price: number;
  currency: string;
  image: string | null;
  contentType?: string | null;
};

export function StorefrontSearchModal({ storeSlug, isOpen, onClose }: SearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StorefrontProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setResults([]);
      return;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/storefront/${storeSlug}/products?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, storeSlug]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    onClose();
    router.push(`/${storeSlug}?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent 
        side="top"
        overlayClassName="bg-stone-100/70 backdrop-blur-sm"
        className="h-full sm:h-auto sm:max-h-[85vh] w-full p-0 border-0 bg-stone-50/95 backdrop-blur-2xl shadow-2xl overflow-y-auto outline-none transition-all duration-300"
        showCloseButton={false}
      >
        <div className="flex flex-col min-h-full">
            {/* Search Input Area */}
            <div className="sticky top-0 z-10 bg-stone-50/95 border-b border-stone-200/80">
              <div className="flex items-center h-16 px-4 gap-3 max-w-7xl mx-auto w-full">
                <HugeiconsIcon icon={Search01Icon} size={20} className="text-stone-500" />
                <form onSubmit={handleSearchSubmit} className="flex-1">
                  <Input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="SEARCH FOR..."
                    className="h-full border-0 bg-transparent px-0 text-[13px] font-medium tracking-[0.2em] focus-visible:ring-0 focus-visible:outline-none placeholder:text-stone-400 placeholder:font-normal uppercase text-stone-900"
                  />
                </form>
                <button 
                  type="button" 
                  onClick={onClose}
                  className="p-1 hover:bg-stone-200/70 rounded-none transition-colors"
                  aria-label="Close search"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={24} className="text-stone-800" strokeWidth={1.2} />
                </button>
              </div>
            </div>

            {/* Results Section */}
            <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
              {query.trim() && (
                <div className="flex flex-col gap-6">
                  <div>
                    <h3 className="text-[10px] font-bold tracking-[0.2em] text-stone-500 uppercase pb-2 mb-4 border-b border-stone-200/80 w-full sm:w-fit sm:min-w-24">
                      Products
                    </h3>
                    
                    {isSearching && results.length === 0 ? (
                      <div className="py-12 text-center text-stone-500 animate-pulse">
                        <p className="text-xs tracking-widest text-stone-500">SEARCHING...</p>
                      </div>
                    ) : results.length > 0 ? (
                      <div className="grid grid-cols-1 gap-y-6">
                        {results.map((product) => {
                          const shouldUnoptimize = product.image?.includes(".ufs.sh") ||
                            product.image?.includes("utfs.io") ||
                            product.image?.includes(".cdninstagram.com") ||
                            product.image?.includes(".fbcdn.net");
                          return (
                            <Link
                              key={product.id}
                              href={`/${storeSlug}/${product.slug}`}
                              onClick={onClose}
                              className="flex gap-6 group items-start"
                            >
                              <div className="relative h-28 w-20 sm:h-36 sm:w-28 shrink-0 overflow-hidden bg-stone-200 flex-none rounded-none border border-stone-200">
                                {product.image ? (
                                  <Image
                                    src={product.image}
                                    alt={product.name}
                                    fill
                                    sizes="(max-width: 640px) 80px, 112px"
                                    unoptimized={shouldUnoptimize}
                                    className="object-cover transition-transform group-hover:scale-105 duration-500"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-stone-500">
                                    <HugeiconsIcon icon={Search01Icon} size={24} />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 py-1 flex flex-col justify-center gap-1.5 h-28 sm:h-36">
                                <h4 className="text-[11px] sm:text-xs font-bold tracking-widest text-stone-900 uppercase group-hover:text-stone-600 transition-colors">
                                  {product.name}
                                </h4>
                                <p className="text-[11px] sm:text-xs font-medium text-stone-500 tracking-wider">
                                  {product.currency} {product.price.toLocaleString()}
                                </p>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-12 text-center text-stone-500">
                        <p className="text-xs tracking-widest uppercase text-stone-500">No products found for &ldquo;{query}&rdquo;</p>
                      </div>
                    )}
                  </div>

                  {results.length > 0 && !isSearching && (
                    <button
                      onClick={handleSearchSubmit}
                      className="text-[10px] font-bold tracking-[0.2em] text-stone-500 hover:text-stone-900 transition-colors uppercase mt-4 text-left"
                    >
                      See all results for &ldquo;{query}&rdquo;
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </SheetContent>
    </Sheet>
  );
}
