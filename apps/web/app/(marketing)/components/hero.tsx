import Link from "next/link";

export function Hero() {
  const demo = "https://shopvendly.store/vendly";

  return (
    <section className="relative min-h-svh overflow-hidden bg-neutral-950">
      <div className="absolute inset-0 bg-[url('https://mplsrodasp.ufs.sh/f/9yFN4ZxbAeCYLZfYTtpq90aBj2MZ7ruxwhyb3WcSHPCzIkU8')] bg-cover bg-center" />
      <div className="absolute inset-0 bg-black/55" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_35%)]" />

      <div className="relative z-10 mx-auto flex min-h-svh max-w-7xl flex-col justify-center px-6 pb-10 pt-20 sm:px-8 sm:pt-24 lg:px-12 lg:pb-12 lg:pt-28">
        <div className="flex flex-col items-start justify-center text-left">
          <h1 className="max-w-4xl text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-6xl md:text-7xl lg:text-[5.4rem]">
            One solution
            <br />
            for selling online.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/80 sm:text-lg sm:leading-8">
            One link gives you a storefront, mobile money payments, and customer
            insights share it anywhere you sell.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-start gap-4">
            <Link
              href="/account"
              className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-8 text-sm font-semibold text-white font-bold transition-transform duration-150 ease-out hover:bg-primary/90 active:scale-[0.97]"
            >
              Create your store for free
            </Link>
            <Link
              href={demo}
              className="inline-flex h-12 items-center justify-center rounded-md border font-bold border-white/25 bg-white/5 px-8 text-sm font-semibold text-white hover:text-primary transition-transform duration-150 ease-out hover:bg-white/10 active:scale-[0.97]"
            >
              Talk to us
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}