import Link from "next/link";

export function Hero() {
  const demo = "https://shopvendly.store/vendly";

  return (
    <section className="relative min-h-svh overflow-hidden bg-neutral-950">
      <div className="absolute inset-0 bg-[url('https://mplsrodasp.ufs.sh/f/9yFN4ZxbAeCYLZfYTtpq90aBj2MZ7ruxwhyb3WcSHPCzIkU8')] bg-cover bg-center" />
      <div className="absolute inset-0 bg-black/55" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_35%)]" />

      <div className="relative z-10 mx-auto flex min-h-svh max-w-7xl flex-col justify-center px-6 pb-10 pt-20 sm:px-8 sm:pt-24 lg:px-12 lg:pb-12 lg:pt-28">
        <div className="flex flex-col items-center justify-center text-center">
          <h1 className="max-w-4xl text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-6xl md:text-7xl lg:text-[5.4rem]">
            One store to
            <br />
            reach everywhere.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/80 sm:text-lg sm:leading-8">
            One link gives you a storefront, mobile money payments, and customer
            insights — share it anywhere you sell.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/account"
              className="inline-flex h-12 items-center justify-center rounded-full bg-white px-8 text-sm font-semibold text-black transition-transform duration-150 ease-out hover:bg-white/90 active:scale-[0.97]"
            >
              Start selling free
            </Link>
            <Link
              href={demo}
              className="inline-flex h-12 items-center justify-center rounded-full border border-white/25 bg-white/5 px-8 text-sm font-semibold text-white transition-transform duration-150 ease-out hover:bg-white/10 active:scale-[0.97]"
            >
              See demo
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}