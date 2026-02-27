import Link from "next/link";
import { Anton } from "next/font/google";

const anton = Anton({ weight: "400", subsets: ["latin"], display: "swap" });

const productLinks = [
  { title: "Features", href: "/#product" },
  { title: "Pricing", href: "/#pricing" },
  { title: "For Creators", href: "/#solutions" },
  { title: "For Stores", href: "/#solutions" },
]

const companyLinks = [
  { title: "About", href: "/#about" },
  { title: "Contact", href: "/#contact" },
  { title: "Privacy Policy", href: "/privacy" },
  { title: "Terms of Service", href: "/terms" },
]

const followLinks = [
  { title: "Instagram", href: "https://www.instagram.com/shopvendly" },
  { title: "TikTok", href: "https://www.tiktok.com/@shopvendly" },
  { title: "WhatsApp", href: "https://wa.me/256780808992" },
]

const Footer = () => {
  return (
    <>
      {/* CTA Band */}
      <div className="py-14 md:py-20 px-5 text-center border-t border-white/5 relative z-10">
        <h2
          className={`${anton.className} text-[clamp(26px,4vw,44px)] font-extrabold text-white leading-[1.1] mb-4 tracking-normal`}
        >
          Your forever customers are waiting.<br />
          Give them a checkout in minutes.
        </h2>
        <p className="text-[14px] text-white/70 mb-10">
          Set up ShopVendly in 3 minutes.
        </p>
        <Link
          href="/c"
          className="inline-flex items-center gap-2 bg-[#FF2FB2] hover:bg-[#ff4bc2] text-white font-bold text-[15px] rounded-full px-9 py-4 hover:-translate-y-0.5 transition-all duration-200 shadow-xl shadow-[#FF6FA5]/20"
        >
          Create your free store →
        </Link>
      </div>

      {/* Footer */}
      <footer className="bg-white/5 px-5 pt-10 md:pt-14 pb-8 border-t border-white/5 relative z-10">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-10 mb-10 md:mb-12">
            {/* Brand col */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-1 group shrink-0 mb-4">
                <span
                  className={`${anton.className} text-[20px] leading-none text-white`}
                >
                  shop
                </span>
                <span
                  className="text-[18px] font-bold leading-none text-[#5B4BFF] -ml-[2px]"
                  style={{ fontFamily: "var(--font-sora), Sora, sans-serif" }}
                >
                  Vendly
                </span>
              </div>
              <p className="text-[13px] text-white/60 leading-relaxed">
                Sell more from every post you share. Built for Instagram, TikTok,
                and WhatsApp sellers across Africa.
              </p>
            </div>

            {/* Product */}
            <div>
              <div className="text-[10px] font-semibold tracking-[1px] uppercase text-white/40 mb-4">Product</div>
              <ul className="flex flex-col gap-2.5">
                {productLinks.map((l) => (
                  <li key={l.title}>
                    <Link href={l.href} className="text-[13px] text-white/60 hover:text-white transition-colors">
                      {l.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <div className="text-[10px] font-semibold tracking-[1px] uppercase text-white/40 mb-4">Company</div>
              <ul className="flex flex-col gap-2.5">
                {companyLinks.map((l) => (
                  <li key={l.title}>
                    <Link href={l.href} className="text-[13px] text-white/60 hover:text-white transition-colors">
                      {l.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Follow */}
            <div>
              <div className="text-[10px] font-semibold tracking-[1px] uppercase text-white/40 mb-4">Follow</div>
              <ul className="flex flex-col gap-2.5">
                {followLinks.map((l) => (
                  <li key={l.title}>
                    <Link href={l.href} className="text-[13px] text-white/60 hover:text-white transition-colors">
                      {l.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-[12px] text-white/40"> 2026 Vendly. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
