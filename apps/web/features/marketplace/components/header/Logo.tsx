import Image from "next/image";
import Link from "next/link";
import { Bricolage_Grotesque } from "next/font/google";

const geistSans = Bricolage_Grotesque({
  variable: "--font-bricolage-grotesque",
  subsets: ["latin"],
});

export function Logo({ className = "" }: { className?: string }) {
    return (
        <Link href="/" className={`flex items-center gap-2.5 shrink-0 group ${className}`}>
            <div className="relative w-9 h-9 transition-transform group-hover:scale-105">
                <Image
                    src="/vendly.png"
                    alt="Vendly"
                    width={36}
                    height={36}
                    className="object-contain"
                />
            </div>
            <span className={`${geistSans.className} text-lg font-semibold tracking-tight`}>
                duuka
            </span>
        </Link>
    );
}

export function MobileLogo() {
    return (
        <Link
            href="/"
            className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2"
        >
            <Image src="/vendly.png" alt="Vendly" width={28} height={28} />
            <span className="text-base font-semibold tracking-tight">
              duuka
            </span>
        </Link>
    );
}
