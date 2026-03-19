"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { Sheet, SheetContent } from "@shopvendly/ui/components/sheet";
import { Input } from "@shopvendly/ui/components/input";
import { cn } from "@shopvendly/ui/lib/utils";

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
  const [isPending, startTransition] = useTransition();

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
        overlayClassName="bg-black/40 backdrop-blur-sm"
        className="h-full sm:h-auto sm:max-h-[85vh] w-full p-0 border-0 bg-black/70 backdrop-blur-2xl shadow-2xl overflow-y-auto outline-none transition-all duration-300"
        showCloseButton={false}
      >
        <div className="flex flex-col min-h-full">
            {/* Search Input Area */}
            <div className="sticky top-0 z-10 bg-transparent border-b border-white/10">
              <div className="flex items-center h-16 px-4 gap-3 max-w-7xl mx-auto w-full">
                <HugeiconsIcon icon={Search01Icon} size={20} className="text-neutral-400" />
                <form onSubmit={handleSearchSubmit} className="flex-1">
                  <Input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="SEARCH FOR..."
                    className="h-full border-0 bg-transparent px-0 text-[13px] font-medium tracking-[0.2em] focus-visible:ring-0 focus-visible:outline-none placeholder:text-neutral-500 placeholder:font-normal uppercase text-white"
                  />
                </form>
                <button 
                  type="button" 
                  onClick={onClose}
                  className="p-1 hover:bg-white/5 rounded-none transition-colors"
                  aria-label="Close search"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={24} className="text-white" strokeWidth={1.2} />
                </button>
              </div>
            </div>

            {/* Results Section */}
            <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
              {query.trim() && (
                <div className="flex flex-col gap-6">
                  <div>
                    <h3 className="text-[10px] font-bold tracking-[0.2em] text-neutral-400 uppercase pb-2 mb-4 border-b border-white/10 w-full sm:w-fit sm:min-w-24">
                      Products
                    </h3>
                    
                    {isSearching && results.length === 0 ? (
                      <div className="py-12 text-center text-neutral-400 animate-pulse">
                        <p className="text-xs tracking-widest text-white/60">SEARCHING...</p>
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
                              <div className="relative h-28 w-20 sm:h-36 sm:w-28 shrink-0 overflow-hidden bg-neutral-800 flex-none rounded-none border border-white/5">
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
                                  <div className="flex h-full w-full items-center justify-center text-neutral-600">
                                    <HugeiconsIcon icon={Search01Icon} size={24} />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 py-1 flex flex-col justify-center gap-1.5 h-28 sm:h-36">
                                <h4 className="text-[11px] sm:text-xs font-bold tracking-widest text-white uppercase group-hover:text-neutral-400 transition-colors">
                                  {product.name}
                                </h4>
                                <p className="text-[11px] sm:text-xs font-medium text-neutral-400 tracking-wider">
                                  {product.currency} {product.price.toLocaleString()}
                                </p>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-12 text-center text-neutral-400">
                        <p className="text-xs tracking-widest uppercase text-white/60">No products found for &ldquo;{query}&rdquo;</p>
                      </div>
                    )}
                  </div>

                  {results.length > 0 && !isSearching && (
                    <button
                      onClick={handleSearchSubmit}
                      className="text-[10px] font-bold tracking-[0.2em] text-neutral-500 hover:text-white transition-colors uppercase mt-4 text-left"
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
