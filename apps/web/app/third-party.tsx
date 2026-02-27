"use client";

import dynamic from "next/dynamic";
import Script from "next/script";

const GA_ID = "G-JWNNZYPEX5";

const Analytics = dynamic(
  () => import("@vercel/analytics/next").then((m) => m.Analytics),
  { ssr: false }
);

// const SpeedInsights = dynamic(
//   () => import("@vercel/speed-insights/next").then((m) => m.SpeedInsights),
//   { ssr: false }
// );

export function ThirdParty() {
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
      </Script>
      <Analytics />
      {/* <SpeedInsights /> */}
    </>
  );
}
