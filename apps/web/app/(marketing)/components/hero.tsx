import Link from "next/link";

export function Hero() {
  return (
    <section className="relative min-h-svh overflow-hidden bg-neutral-950">
      <div className="absolute inset-0 bg-[url('https://mplsrodasp.ufs.sh/f/9yFN4ZxbAeCYLZfYTtpq90aBj2MZ7ruxwhyb3WcSHPCzIkU8')] bg-cover bg-center" />
      <div className="absolute inset-0 bg-black/55" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_35%)]" />

      <div className="relative z-10 mx-auto flex min-h-svh max-w-7xl flex-col justify-end px-6 pb-10 pt-20 sm:justify-center sm:px-8 sm:pt-24 lg:px-12 lg:pb-12 lg:pt-28">
        <div className="flex flex-col items-start justify-center text-left">
          <h1 className="max-w-2xl text-[2.6rem] font-bold leading-[1.05] tracking-tight text-white sm:text-6xl md:text-7xl lg:text-[5rem]">
            Everything you need to sell online.
            <br />
            <span className="text-white/60">In one place.</span>
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-white/65 sm:text-lg">
            Your store. Your payments. Your orders. Built for the way you sell.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-start gap-4">
            <Link
              href="/account"
              className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-8 text-sm font-semibold text-white font-bold transition-transform duration-150 ease-out hover:bg-primary/90 active:scale-[0.97]"
            >
              Start Free
            </Link>
            <Link
              href="https://wa.me/256780808992"
              target="_blank"
              rel="noreferrer"
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
