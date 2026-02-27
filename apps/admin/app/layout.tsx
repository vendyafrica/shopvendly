import { SpeedInsights } from "@vercel/speed-insights/next";
import "@shopvendly/ui/globals.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Nunito_Sans } from "next/font/google";
import type { ReactNode } from "react";

const nunitoSans = Nunito_Sans({subsets:['latin'],variable:'--font-sans'});


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
    
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
export const metadata: Metadata = {
  title: {
    default: "Vendly",
    template: "%s | Vendly",
  },
  description: "Vendly",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
   return (
    <html lang="en" className={nunitoSans.variable}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SpeedInsights/>
        {children}
      </body>
    </html>
  );
}
