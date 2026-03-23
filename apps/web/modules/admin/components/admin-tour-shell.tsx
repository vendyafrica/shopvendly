"use client";

import * as React from "react";
import { Button } from "@shopvendly/ui/components/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@shopvendly/ui/components/card";
import { TourProvider, useTour, type Tour } from "@shopvendly/ui/components/tour";
import { ArrowRight02Icon, SparklesIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

const TOUR_STORAGE_KEY = "shopvendly-admin-demo-tour-dismissed";
const DEMO_TOUR_ID = "vendly-admin-demo";

const tours = [
  {
    id: DEMO_TOUR_ID,
    steps: [
      {
        id: "admin-overview",
        title: "Your command center",
        content: "These cards show sales, activity, and what needs attention today.",
        side: "bottom",
        variant: "playful",
        color: "rgba(236, 72, 153, 0.9)", // Pink
        nextRoute: "/admin/vendly/settings",
      },
      {
        id: "store-logo",
        title: "Brand it your way",
        content: "Upload a logo so the store feels yours everywhere customers see it.",
        side: "bottom",
        variant: "playful",
        color: "rgba(139, 92, 246, 0.9)", // Violet
      },
      {
        id: "store-policy",
        title: "Set the store rules",
        content: "Write your policy here so buyers know delivery, returns, and exchanges.",
        side: "top",
        variant: "playful",
        color: "rgba(16, 185, 129, 0.9)", // Emerald
      },
      {
        id: "store-hero",
        title: "Make the page feel alive",
        content: "Add a hero image to turn the storefront into a bold first impression.",
        side: "top",
        variant: "playful",
        color: "rgba(244, 63, 94, 0.9)", // Rose
        nextRoute: "/admin/vendly",
      },
      {
        id: "recent-activity",
        title: "Live activity",
        content: "See new orders and customer action as they happen in real time.",
        side: "top",
        variant: "playful",
        color: "rgba(79, 70, 229, 0.9)", // Indigo
      },
    ],
  },
] satisfies Tour[];

function TourStarter() {
  const tour = useTour();

  React.useEffect(() => {
    tour.start(DEMO_TOUR_ID);
  }, [tour]);

  return null;
}

function TourIntroModal({ open, onTakeTour, onSkip }: { open: boolean; onTakeTour: () => void; onSkip: () => void }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/20 px-4">
      <Card className="w-full max-w-sm border-gray-200 bg-white p-2 shadow-xl ring-1 ring-black/5">
        <CardHeader className="pt-8 text-center pb-4">
          <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full text-blue-600">
            <span className="text-3xl">👋</span>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-gray-900">
            Hi there! Want a quick tour?
          </CardTitle>
          <CardDescription className="mx-auto max-w-[280px] pt-3 text-base leading-relaxed text-gray-500">
            We&apos;ll show you around in about 45 seconds. It&apos;s painless, we promise!
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-col gap-2 pb-6 px-6 pt-2">
          <Button 
            onClick={onTakeTour} 
            className="h-12 w-full rounded-lg text-white hover:bg-primary/80 font-medium text-base shadow-sm transition-colors"
          >
            Sure, let&apos;s go!
          </Button>
          <Button 
            variant="ghost" 
            onClick={onSkip} 
            className="h-10 w-full text-gray-400 hover:text-gray-600 hover:bg-transparent font-normal"
          >
            Not now, thanks
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export function AdminTourShell({ children, storeSlug }: { children: React.ReactNode; storeSlug: string }) {
  const isDemoStore = storeSlug === "vendly";
  const [showIntro, setShowIntro] = React.useState(false);
  const [ready, setReady] = React.useState(false);
  const [shouldStartTour, setShouldStartTour] = React.useState(false);

  React.useEffect(() => {
    setReady(true);
    if (!isDemoStore) return;
    const dismissed = window.localStorage.getItem(TOUR_STORAGE_KEY);
    if (!dismissed) setShowIntro(true);
  }, [isDemoStore]);

  const handleTakeTour = () => {
    window.localStorage.setItem(TOUR_STORAGE_KEY, "taken");
    setShowIntro(false);
    setShouldStartTour(true);
  };

  const handleSkip = () => {
    window.localStorage.setItem(TOUR_STORAGE_KEY, "skipped");
    setShowIntro(false);
  };

  React.useEffect(() => {
    if (!showIntro) {
      return;
    }

    setShouldStartTour(false);
  }, [showIntro]);

  if (!isDemoStore) {
    return <>{children}</>;
  }

  return (
    <TourProvider tours={tours}>
      {children}
      {ready && showIntro && <TourIntroModal open onTakeTour={handleTakeTour} onSkip={handleSkip} />}
      {ready && shouldStartTour && <TourStarter />}
    </TourProvider>
  );
}
