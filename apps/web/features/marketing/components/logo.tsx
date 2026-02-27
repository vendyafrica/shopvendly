import { Anton } from "next/font/google";

const anton = Anton({ weight: "400", subsets: ["latin"], display: "swap" });

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <span className={`${anton.className} text-[20px] leading-none text-white`}>
        shop
      </span>
      <span
        className="text-[18px] font-bold leading-none text-[#5B4BFF] -ml-[2px]"
        style={{ fontFamily: "var(--font-sora), Sora, sans-serif" }}
      >
        Vendly
      </span>
    </div>
  );
}
