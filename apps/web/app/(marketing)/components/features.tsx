type FeatureSection = {
  eyebrow: string;
  title: string;

  description: string;
  image: string;
};

const featureSections: FeatureSection[] = [
  {
    eyebrow: "Storefront",
    title: "A store that works while you sleep.",
    description:
      "Your Vendly store takes orders, confirms payments, and updates inventory on its own. You post the content — the store handles what comes after.",
    image: "https://cdn.cosmos.so/ca8ae899-9ce5-40a9-a3d1-da285d32f671?format=jpeg",
  },
  {
    eyebrow: "Payments",
    title: "Mobile money, built in from day one.",
    description:
      "Accept MTN and Airtel Money without a third-party workaround. Every payment lands in your dashboard, confirmed, recorded, done.",
    image: "...",
  },
  {
    eyebrow: "Delivery",
    title: "Delivery without the back and forth.",
    description:
      "Book a rider, track the parcel, and keep your customer updated — all from the same place you took the order. No calls. No WhatsApp threads.",
    image: "...",
  },
  {
    eyebrow: "Discovery",
    title: "Customers who were never in your following.",
    description:
      "Every Vendly store is listed on our marketplace. Buyers searching for what you sell can find you without ever seeing your Instagram.",
    image: "...",
  },
  {
    eyebrow: "Operations",
    title: "One place for all of it.",
    description:
      "Orders, payments, delivery, and customer data in a single dashboard. When the business grows, the operations don't have to grow with it.",
    image: "...",
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