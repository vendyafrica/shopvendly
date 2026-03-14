type FeatureSection = {
  eyebrow: string;
  title: string;

  description: string;
  image: string;
};

const featureSections: FeatureSection[] = [
  {
    eyebrow: "Cheaper",
    title: "Cheaper to run",
    description:
      "Get the core tools you need without paying Shopify-level costs for features you may never use.",
    image:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1600&auto=format&fit=crop",
  },
  {
    eyebrow: "Payments",
    title: "Local payments built in",
    description:
      "Accept mobile money and keep payment records in the same place you manage orders.",
    image:
      "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?q=80&w=1600&auto=format&fit=crop",
  },
  {
    eyebrow: "Delivery",
    title: "Delivery in the workflow",
    description:
      "Book delivery, track parcels, and keep customers updated without switching tools.",
    image:
      "https://images.unsplash.com/photo-1523475472560-d2df97ec485c?q=80&w=1600&auto=format&fit=crop",
  },
  {
    eyebrow: "Discovery",
    title: "Marketplace discovery",
    description:
      "Reach buyers who are already searching, not only the people who already follow you.",
    image:
      "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?q=80&w=1600&auto=format&fit=crop",
  },
  {
    eyebrow: "Growth",
    title: "More freedom to grow",
    description:
      "Run sales, orders, payments, and delivery from one place so growth does not mean more chaos.",
    image:
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1600&auto=format&fit=crop",
  },
];

export function Features() {
  return (
    <section className="py-24">
      <div className="mx-auto w-full max-w-4xl px-6">
        <div className="text-center">
          <p className="text-primary text-sm font-medium uppercase tracking-[0.18em]">
            Why ShopVendly
          </p>
          <h2 className="text-3xl font-semibold md:text-4xl">
            Built for stores that want more than Instagram
          </h2>
          <p className="text-muted-foreground mt-4 text-lg">
            Instagram gets attention. ShopVendly runs the business behind it.
          </p>
        </div>

        <div className="mt-16 space-y-10">
          {featureSections.map((feature) => (
            <article
              key={feature.title}
              className="relative overflow-hidden rounded-3xl border border-border/50 bg-muted/30"
            >
              <div
                className="absolute inset-0 opacity-40"
                style={{
                  backgroundImage: `linear-gradient(120deg, rgba(255,255,255,0.9), rgba(255,255,255,0.4)), url(${feature.image})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
              <div className="relative z-10 p-10">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/80">
                  {feature.eyebrow}
                </p>
                <h3 className="mt-3 text-3xl font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-4 max-w-2xl text-base text-foreground/80">
                  {feature.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}