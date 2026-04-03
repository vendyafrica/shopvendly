import type { ReactNode } from "react";
import { Suspense } from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@shopvendly/auth";

import { OnboardingProvider } from "./context/onboarding-context";
import { AppSessionProvider } from "@/contexts/app-session-context";
import { StepIndicator } from "./components/category-selector";
import Image from "next/image";

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
    <div className="min-h-dvh bg-white text-black flex flex-col overflow-hidden selection:bg-primary selection:text-white">
      <header className="relative z-10 flex items-center justify-between px-5 py-4 md:px-10 shrink-0">
        <Link href="/" className="flex items-center gap-1.5 shrink-0 opacity-80 hover:opacity-100 transition-opacity">
          <Image src="/vendly.png" alt="Vendly" width={22} height={22} />
        </Link>
        <StepIndicator />
      </header>

      {/* Scrollable content area */}
      <main className="relative z-10 flex-1 overflow-y-auto flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm">{children}</div>
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