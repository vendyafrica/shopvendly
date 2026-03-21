"use client";

import Image from "next/image";
import Link from "next/link";
import { Bricolage_Grotesque } from "next/font/google";

const bricolageGrotesque = Bricolage_Grotesque({
  variable: "--font-bricolage-grotesque",
  subsets: ["latin"],
});

type Collection = {
    id: string;
    title: string;
    imageUrl: string | null;
    href: string;
};

export function CollectionsRail({
    categories,
    title = "Curated Collections",
}: {
    categories: { id: string; name: string; slug: string; image: string | null }[];
    title?: string;
}) {
    const collections: Collection[] = categories.slice(0, 8).map((c) => ({
        id: c.id,
        title: c.name,
        imageUrl: c.image ?? null,
        href: `/category/${c.slug}`,
    }));

    if (collections.length === 0) return null;

    return (
        <section className="py-6 md:py-8 bg-background">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between mb-5 md:mb-6">
                    <h3 className={`text-xl md:text-2xl font-semibold tracking-tight ${bricolageGrotesque.className}`}>{title}</h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    {collections.map((collection) => (
                        <Link
                            key={collection.id}
                            href={collection.href}
                            className="group relative h-28 md:h-32 w-full rounded-3xl overflow-hidden shadow-sm border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                        >
                            <Image
                                src={
                                    collection.imageUrl ||
                                    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1200&auto=format&fit=crop"
                                }
                                alt={collection.title}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                                sizes="(max-width: 768px) 100vw, 400px"
                            />
                            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute inset-0 bg-linear-to-t from-black/35 via-black/10 to-transparent" />

                            <div className="absolute inset-0 flex items-end">
                                <div className="px-4 md:px-5 pb-4 space-y-1">
                                    <h3 className={`text-sm sm:text-lg md:text-xl font-semibold text-white drop-shadow-sm ${bricolageGrotesque.className}`}>
                                        {collection.title}
                                    </h3>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
