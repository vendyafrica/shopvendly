import type { ReactNode } from "react";
import { Suspense } from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@shopvendly/auth";

import { OnboardingProvider } from "./context/onboarding-context";
import { AppSessionProvider } from "@/contexts/app-session-context";
import { StepIndicator } from "./components/category-selector";

import { Anton } from "next/font/google";

const anton = Anton({ weight: "400", subsets: ["latin"], display: "swap" });

export default async function OnboardingLayout({ children }: { children: ReactNode }) {
  const headerList = await headers();
  const sessionPromise = auth.api.getSession({ headers: headerList });

  return (
    <OnboardingProvider>
      <Suspense
        fallback={
          <AppSessionProvider session={null}>
            <OnboardingShell>{children}</OnboardingShell>
          </AppSessionProvider>
        }
      >
        <SessionBoundary sessionPromise={sessionPromise}>
          <OnboardingShell>{children}</OnboardingShell>
        </SessionBoundary>
      </Suspense>
    </OnboardingProvider>
  );
}

function OnboardingShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-white text-black flex flex-col overflow-hidden selection:bg-[#5B4BFF] selection:text-black">
      {/* Header — fixed height */}
      <header className="relative z-10 flex flex-col gap-3 items-start md:flex-row md:items-center md:justify-between px-4 py-3 md:px-8 border-b border-black/10 bg-transparent shrink-0">
        <Link href="/" className="flex items-center gap-1 group shrink-0">
          <span
            className={`${anton.className} text-[20px] leading-none text-black`}
          >
            shop
          </span>
          <span
            className="text-[18px] font-bold leading-none text-[#5B4BFF] -ml-[2px]"
            style={{ fontFamily: "var(--font-sora), Sora, sans-serif" }}
          >
            Vendly
          </span>
        </Link>
        <div className="w-full md:w-auto">
          <StepIndicator />
        </div>
      </header>

      {/* Scrollable content area */}
      <main className="relative z-10 flex-1 overflow-y-auto flex items-center justify-center px-4 md:px-6 py-10">
        <div className="w-full max-w-3xl flex justify-center">{children}</div>
      </main>
    </div>
  );
}

async function SessionBoundary({
  children,
  sessionPromise,
}: {
  children: ReactNode;
  sessionPromise: ReturnType<typeof auth.api.getSession>;
}) {
  const session = await sessionPromise;
  return <AppSessionProvider session={session}>{children}</AppSessionProvider>;
}