import Image from "next/image"
import { Anton } from "next/font/google"

const anton = Anton({ weight: "400", subsets: ["latin"], display: "swap" })

type LogoProps = {
  className?: string
  showWordmark?: boolean
}

export function Logo({ className = "", showWordmark = true }: LogoProps) {
  return (
    <div className={`flex w-fit items-center gap-2 ${className}`}>
      <div className="relative h-8 w-8 overflow-hidden rounded-full bg-white/10 p-1 shadow-sm">
        <Image src="/vendly.png" alt="Vendly symbol" fill sizes="32px" className="object-contain" priority />
      </div>
      {showWordmark && (
        <div className="flex flex-col leading-none">
          <span className={`${anton.className} text-base uppercase tracking-[0.3em] text-primary/80`}>
            SHOP
          </span>
          <span className="text-lg font-bold text-primary">Vendly</span>
        </div>
      )}
    </div>
  )
}
