"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon, Cancel01Icon, Store01Icon } from "@hugeicons/core-free-icons";
import { Sheet, SheetContent } from "@shopvendly/ui/components/sheet";
import { Input } from "@shopvendly/ui/components/input";

const FALLBACK_STORE_IMAGE = "https://cdn.cosmos.so/974817a0-84de-4604-95c9-93db9b929ea9?format=jpeg";

function isVideoUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return [".mp4", ".mov", ".webm", ".avi", ".m4v", ".mkv"].some((ext) => lower.includes(ext)) || 
         lower.includes("video") || lower.includes("quicktime");
}

function isVideo(contentType: string | null | undefined): boolean {
  return !!contentType?.startsWith("video/");
}

interface MarketplaceSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SearchResultStore = {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  images?: string[];
  mediaItems?: { url: string; contentType: string | null }[];
};

type SearchResultProduct = {
  id: string;
  slug: string;
  name: string;
  price: number;
  currency: string;
  image: string | null;
  contentType?: string | null;
  store: {
    name: string;
    slug: string;
  };
};

export function MarketplaceSearchModal({ isOpen, onClose }: MarketplaceSearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ stores: SearchResultStore[]; products: SearchResultProduct[] }>({
    stores: [],
    products: []
  });
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setResults({ stores: [], products: [] });
      return;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults({ stores: [], products: [] });
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/marketplace/search?q=${encodeURIComponent(query.trim())}&storeLimit=5&productLimit=10`);
        if (res.ok) {
          const json = await res.json();
          setResults(json.data ?? json);
        }
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    onClose();
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const hasAnyResults = results.stores.length > 0 || results.products.length > 0;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent 
        side="top"
        overlayClassName="bg-white/70 backdrop-blur-sm"
        className="h-full sm:h-auto sm:max-h-[90vh] w-full p-0 border-0 bg-white shadow-2xl overflow-y-auto outline-none"
        showCloseButton={false}
      >
        <div className="flex flex-col min-h-full">
            {/* Search Input Area */}
            <div className="sticky top-0 z-10 bg-white border-b border-border">
              <div className="flex items-center h-20 px-4 md:px-8 gap-4 max-w-7xl mx-auto w-full">
                <HugeiconsIcon icon={Search01Icon} size={24} className="text-muted-foreground" />
                <form onSubmit={handleSearchSubmit} className="flex-1">
                  <Input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search for stores and products..."
                    className="h-full border-0 bg-transparent px-0 text-lg md:text-xl font-medium focus-visible:ring-0 focus-visible:outline-none placeholder:text-muted-foreground/60"
                  />
                </form>
                <button 
                  type="button" 
                  onClick={onClose}
                  className="p-2 hover:bg-muted rounded-full transition-colors"
                  aria-label="Close search"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={28} className="text-foreground" />
                </button>
              </div>
            </div>

            {/* Results Section */}
            <div className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
              {query.trim() && (
                <div className="flex flex-col gap-10">
                  
                  {/* Stores Results */}
                  {results.stores.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold tracking-widest text-muted-foreground uppercase mb-6 flex items-center gap-2">
                        <HugeiconsIcon icon={Store01Icon} size={14} />
                        Stores
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {results.stores.map((store) => {
                          const rawMediaItems = (store as any).mediaItems && (store as any).mediaItems.length > 0
                            ? (store as any).mediaItems
                             : ((store as any).images || []).map((url: string) => ({ url, contentType: null }));
                          
                          const bestMedia = rawMediaItems.length > 0 ? rawMediaItems[0] : { url: FALLBACK_STORE_IMAGE, contentType: "image/jpeg" };
                          const isVideoMedia = isVideo(bestMedia.contentType) || isVideoUrl(bestMedia.url);

                          return (
                            <Link
                              key={store.id}
                              href={`/${store.slug}`}
                              onClick={onClose}
                              className="flex items-center gap-4 p-3 rounded-2xl hover:bg-muted transition-all active:scale-[0.98]"
                            >
                              <div className="relative h-14 w-14 rounded-xl overflow-hidden bg-white flex-none border border-border flex items-center justify-center">
                                {isVideoMedia ? (
                                  <video
                                    src={bestMedia.url}
                                    autoPlay
                                    muted
                                    loop
                                    playsInline
                                    className="absolute inset-0 h-full w-full object-cover"
                                  />
                                ) : (
                                  <Image
                                    src={bestMedia.url}
                                    alt={store.name}
                                    fill
                                    className="object-cover z-10"
                                    unoptimized
                                    onError={(e) => {
                                      (e.currentTarget as HTMLImageElement).style.visibility = 'hidden';
                                    }}
                                  />
                                )}
                                <span className="text-black font-semibold text-sm">
                                  {store.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm truncate">{store.name}</h4>
                                <p className="text-xs text-muted-foreground truncate">@{store.slug}</p>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Products Results */}
                  {results.products.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold tracking-widest text-muted-foreground uppercase mb-6 flex items-center gap-2">
                        <HugeiconsIcon icon={Search01Icon} size={14} />
                        Products
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {results.products.map((product) => {
                          const isVideoMedia = isVideo(product.contentType) || (product.image && isVideoUrl(product.image));
                          return (
                            <Link
                              key={product.id}
                              href={`/${product.store.slug}/${product.slug}`}
                              onClick={onClose}
                              className="flex gap-4 group items-start"
                            >
                              <div className="relative h-24 w-24 shrink-0 overflow-hidden bg-muted rounded-2xl border border-border flex items-center justify-center text-muted-foreground font-bold text-xs uppercase">
                                {product.image ? (
                                  isVideoMedia ? (
                                    <video
                                      src={product.image}
                                      autoPlay
                                      muted
                                      loop
                                      playsInline
                                      className="absolute inset-0 h-full w-full object-cover"
                                    />
                                  ) : (
                                    <Image
                                      src={product.image}
                                      alt={product.name}
                                      fill
                                      className="object-cover transition-transform group-hover:scale-110 duration-500"
                                      unoptimized
                                    />
                                  )
                                ) : (
                                  <span>NO IMAGE</span>
                                )}
                              </div>
                              <div className="flex-1 py-1 flex flex-col justify-center gap-1">
                                <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                                  {product.name}
                                </h4>
                                <p className="text-xs font-medium text-muted-foreground">
                                  {product.currency} {product.price.toLocaleString()}
                                </p>
                                <span className="text-[10px] text-muted-foreground/60 font-medium px-2 py-0.5 bg-muted rounded-full w-fit">
                                  in {product.store.name}
                                </span>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {isSearching && !hasAnyResults && (
                    <div className="py-20 text-center text-muted-foreground animate-pulse">
                      <p className="text-sm tracking-widest uppercase">Searching...</p>
                    </div>
                  )}

                  {!isSearching && !hasAnyResults && query.length >= 2 && (
                    <div className="py-20 text-center text-muted-foreground">
                      <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <HugeiconsIcon icon={Search01Icon} size={24} className="opacity-40" />
                      </div>
                      <p className="text-sm tracking-widest uppercase">No results found for &ldquo;{query}&rdquo;</p>
                      <p className="text-xs mt-2 opacity-60">Try different keywords or browse our categories</p>
                    </div>
                  )}

                  {hasAnyResults && !isSearching && (
                    <button
                      onClick={handleSearchSubmit}
                      className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-primary hover:text-primary/80 transition-colors uppercase mt-4 w-fit pb-1 border-b-2 border-primary/20"
                    >
                      See all results for &ldquo;{query}&rdquo;
                      <HugeiconsIcon icon={Store01Icon} size={14} />
                    </button>
                  )}
                </div>
              )}

              {!query.trim() && (
                <div className="py-32 text-center pointer-events-none opacity-40">
                  <div className="bg-muted w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                    <HugeiconsIcon icon={Search01Icon} size={40} />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Marketplace Search</h2>
                  <p className="max-w-md mx-auto">Search across thousands of creator stores and products in one place.</p>
                </div>
              )}
            </div>
          </div>
        </SheetContent>
    </Sheet>
  );
}
