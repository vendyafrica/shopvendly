"use client";

import type { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";

import { cn } from "@shopvendly/ui/lib/utils";
import { Button } from "@shopvendly/ui/components/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@shopvendly/ui/components/card";
import {
  Popover,
  PopoverContent,
} from "@shopvendly/ui/components/popover";

const TourContext = React.createContext<{
  start: (tourId: string) => void;
  close: () => void;
} | null>(null);

function useTour() {
  const context = React.useContext(TourContext);
  if (!context) {
    throw new Error("useTour must be used within a TourProvider");
  }
  return context;
}

interface Step {
  id: string;
  title: React.ReactNode;
  content: React.ReactNode; // Renamed from description to content to match existing
  nextRoute?: string;
  previousRoute?: string;
  nextLabel?: React.ReactNode;
  previousLabel?: React.ReactNode;
  side?: React.ComponentProps<typeof PopoverPrimitive.Positioner>["side"];
  sideOffset?: React.ComponentProps<typeof PopoverPrimitive.Positioner>["sideOffset"];
  align?: React.ComponentProps<typeof PopoverPrimitive.Positioner>["align"];
  alignOffset?: React.ComponentProps<typeof PopoverPrimitive.Positioner>["alignOffset"];
  className?: string;
  variant?: "standard" | "playful";
  color?: string;
}

interface Tour {
  id: string;
  steps: Step[];
}

function TourProvider({
  tours,
  children,
}: {
  tours: Tour[];
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [activeTourId, setActiveTourId] = React.useState<string | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = React.useState(0);

  const activeTour = tours.find((tour) => tour.id === activeTourId);
  const steps = activeTour?.steps || [];
  const currentStep = steps[currentStepIndex];

  const next = React.useCallback(() => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      setIsOpen(false);
      setCurrentStepIndex(0);
      setActiveTourId(null);
    }
  }, [currentStepIndex, steps.length]);

  const previous = React.useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  }, [currentStepIndex]);

  const close = React.useCallback(() => {
    setIsOpen(false);
    setCurrentStepIndex(0);
    setActiveTourId(null);
  }, []);

  const start = React.useCallback((tourId: string) => {
    const tour = tours.find((tour) => tour.id === tourId);
    if (tour) {
      if (tour.steps.length > 0) {
        setActiveTourId(tourId);
        setIsOpen(true);
        setCurrentStepIndex(0);
      } else {
        console.error(`Tour with id '${tourId}' has no steps.`);
      }
    } else {
      console.error(`Tour with id '${tourId}' not found.`);
    }
  }, [tours]);

  const contextValue = React.useMemo(() => ({
    start,
    close,
  }), [start, close]);

  return (
    <TourContext.Provider value={contextValue}>
      {children}
      {isOpen && activeTour && currentStep && (
        <TourOverlay
          step={currentStep}
          currentStepIndex={currentStepIndex}
          totalSteps={steps.length}
          onNext={next}
          onPrevious={previous}
          onClose={close}
        />
      )}
    </TourContext.Provider>
  );
}

function TourOverlay({
  step,
  currentStepIndex,
  totalSteps,
  onNext,
  onPrevious,
  onClose,
}: {
  step: Step;
  currentStepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  onClose: () => void;
}) {
  const router = useRouter();
  const [targets, setTargets] = React.useState<
    { rect: DOMRect; radius: number }[]
  >([]);

  // Handle next with navigation
  const handleNext = React.useCallback(() => {
    if (step.nextRoute) {
      router.push(step.nextRoute);
    }
    onNext();
  }, [step.nextRoute, router, onNext]);

  // Handle previous with navigation
  const handlePrevious = React.useCallback(() => {
    if (step.previousRoute) {
      router.push(step.previousRoute);
    }
    onPrevious();
  }, [step.previousRoute, router, onPrevious]);

  const isPlayful = step.variant === "playful";
  const crayonColor = step.color || "rgba(236, 72, 153, 0.8)"; // Default pink if none provided

  // For the playful arrow, we need the popover's position relative to the target
  const [popoverRect, setPopoverRect] = React.useState<DOMRect | null>(null);
  const popoverRef = React.useRef<HTMLDivElement>(null);
  const [randomShake, setRandomShake] = React.useState({ x: 0, y: 0 });

  React.useEffect(() => {
    if (isPlayful && popoverRef.current) {
      const updateRef = () => {
        setPopoverRect(popoverRef.current?.getBoundingClientRect() || null);
      };
      updateRef();
      const observer = new ResizeObserver(updateRef);
      observer.observe(popoverRef.current);
      return () => observer.disconnect();
    }
  }, [isPlayful, step.id]);

  React.useEffect(() => {
    setRandomShake({
      x: (Math.random() - 0.5) * 40,
      y: (Math.random() - 0.5) * 40,
    });
  }, [step.id]);

  React.useEffect(() => {
    let needsScroll = true;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    let lastTargetsJson = "";
    let searchAttempts = 0;
    let searchInterval: ReturnType<typeof setInterval> | null = null;

    // Reset targets when step changes
    setTargets([]);

    function updatePosition() {
      const elements = document.querySelectorAll(
        `[data-tour-step-id*='${step.id}']`,
      );

      if (elements.length > 0) {
        const validElements: {
          rect: {
            width: number;
            height: number;
            x: number;
            y: number;
            left: number;
            top: number;
            right: number;
            bottom: number;
            toJSON: () => void;
          };
          radius: number;
          element: Element;
        }[] = [];

        Array.from(elements).forEach((element) => {
          const rect = element.getBoundingClientRect();
          if (rect.width === 0 && rect.height === 0) return;

          const style = window.getComputedStyle(element);
          const radius = Number.parseFloat(style.borderRadius) || 4;

          validElements.push({
            rect: {
              width: rect.width,
              height: rect.height,
              x: rect.left,
              y: rect.top,
              left: rect.left,
              top: rect.top,
              right: rect.right,
              bottom: rect.bottom,
              toJSON: () => {},
            },
            radius,
            element,
          });
        });

        const newTargets = validElements.map(({ rect, radius }) => ({ rect, radius }));
        const newTargetsJson = JSON.stringify(newTargets.map(t => ({
          l: Math.round(t.rect.left),
          t: Math.round(t.rect.top),
          w: Math.round(t.rect.width),
          h: Math.round(t.rect.height),
          r: t.radius,
        })));

        // Only update state if targets actually changed
        if (newTargetsJson !== lastTargetsJson) {
          lastTargetsJson = newTargetsJson;
          setTargets(newTargets);
        }

        const firstValidElement = validElements[0];

        if (firstValidElement && needsScroll) {
          firstValidElement.element.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          needsScroll = false;
        }
        // Found targets, stop searching
        if (searchInterval) {
          clearInterval(searchInterval);
          searchInterval = null;
        }
      } else {
        if (lastTargetsJson !== "[]") {
          lastTargetsJson = "[]";
          setTargets([]);
        }
        searchAttempts++;
        // After 100 attempts (5 seconds), stop searching
        if (searchAttempts > 100) {
          if (searchInterval) {
            clearInterval(searchInterval);
            searchInterval = null;
          }
        }
      }
    }

    function debouncedUpdate() {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(updatePosition, 16);
    }

    // Initial update
    updatePosition();

    // Keep polling for elements (useful after navigation)
    searchInterval = setInterval(() => {
      if (searchAttempts <= 100) {
        updatePosition();
      }
    }, 50);

    window.addEventListener("resize", debouncedUpdate);
    window.addEventListener("scroll", debouncedUpdate, true);

    // Use a more targeted observer - only watch for layout changes, not all mutations
    const observer = new MutationObserver(debouncedUpdate);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false, // Disable attribute watching to reduce noise
    });

    const resizeObserver = new ResizeObserver(debouncedUpdate);
    // Only observe the target elements, not the entire body
    const targetElements = document.querySelectorAll(`[data-tour-step-id*='${step.id}']`);
    targetElements.forEach(el => resizeObserver.observe(el));

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      if (searchInterval) clearInterval(searchInterval);
      window.removeEventListener("resize", debouncedUpdate);
      window.removeEventListener("scroll", debouncedUpdate, true);
      observer.disconnect();
      resizeObserver.disconnect();
    };
  }, [step]);

  // Only lock body overflow when we have targets to show
  React.useEffect(() => {
    if (targets.length > 0) {
      document.body.style.overflow = "";
    }
  }, [targets.length]);

  if (typeof document === "undefined") return null;
  
  // If no targets found yet, just return null and wait for them to appear
  if (targets.length === 0) {
    return createPortal(
      <div className="fixed inset-0 z-50 pointer-events-none" />,
      document.body
    );
  }

  const renderArrow = () => {
    if (!isPlayful || !popoverRect || targets.length === 0 || !targets[0]?.rect) return null;
    
    const target = targets[0].rect;
    
    // Determine which side of the popover to start the arrow from
    let startX = popoverRect.left + popoverRect.width / 2;
    let startY = popoverRect.top + popoverRect.height / 2;
    
    const targetCenterX = target.left + target.width / 2;
    const targetCenterY = target.top + target.height / 2;
    
    if (targetCenterX < popoverRect.left) {
      startX = popoverRect.left;
    } else if (targetCenterX > popoverRect.right) {
      startX = popoverRect.right;
    }
    
    if (targetCenterY < popoverRect.top) {
      startY = popoverRect.top;
    } else if (targetCenterY > popoverRect.bottom) {
      startY = popoverRect.bottom;
    }

    const endX = targetCenterX;
    const endY = targetCenterY;

    // Create a natural curve based on the distance
    const dist = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
    const midX = (startX + endX) / 2 + (endY - startY) * 0.2 + randomShake.x * (dist / 100);
    const midY = (startY + endY) / 2 - (endX - startX) * 0.2 + randomShake.y * (dist / 100);
    
    const path = `M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`;

    return (
      <motion.path
        d={path}
        fill="none"
        stroke={crayonColor}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="1 5"
        filter="url(#crayon-texture)"
        className="opacity-80"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
      />
    );
  };


  return createPortal(
    <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
      <svg className="absolute inset-0 size-full pointer-events-none">
        <defs>
          <mask id="tour-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {targets.map((target, i) => (
              <rect
                key={i}
                x={target.rect.left}
                y={target.rect.top}
                width={target.rect.width}
                height={target.rect.height}
                rx={target.radius}
                fill="black"
              />
            ))}
          </mask>
          <filter id="crayon-texture" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
        <rect
          width="100%"
          height="100%"
          mask="url(#tour-mask)"
          className="fill-black opacity-20"
        />
        {renderArrow()}
        {targets.map((target, i) => {
          if (isPlayful) {
            return (
              <rect
                key={i}
                x={target.rect.left - 4}
                y={target.rect.top - 4}
                width={target.rect.width + 8}
                height={target.rect.height + 8}
                rx={target.radius + 4}
                fill="none"
                stroke={crayonColor}
                strokeWidth="3"
                strokeLinecap="round"
                filter="url(#crayon-texture)"
                className="opacity-70"
              />
            );
          }
          return (
            <rect
              key={i}
              x={target.rect.left}
              y={target.rect.top}
              width={target.rect.width}
              height={target.rect.height}
              rx={target.radius}
              className="stroke-primary fill-none stroke-2 outline-none"
            />
          );
        })}
      </svg>
      {targets.length > 0 && (
        <Popover key={step.id} open={true}>
          <PopoverContent
            anchor={{
              getBoundingClientRect: () =>
                targets[0]?.rect || {
                  top: 0,
                  left: 0,
                  width: 0,
                  height: 0,
                  bottom: 0,
                  right: 0,
                  x: 0,
                  y: 0,
                  toJSON: () => {},
                },
            }}
            className={cn(
              "p-0 pointer-events-auto", 
              !isPlayful && "shadow-2xl",
              isPlayful && "bg-transparent border-none shadow-none ring-0 overflow-visible",
              step.className
            )}
            side={step.side}
            sideOffset={step.sideOffset || (isPlayful ? 20 : 8)}
            align={step.align}
            alignOffset={step.alignOffset}
            render={!isPlayful ? <Card /> : <div />}
          >
            {isPlayful ? (
              <div 
                ref={popoverRef}
                className="relative min-w-[280px] max-w-[340px] sm:min-w-[340px] sm:max-w-[420px] p-4 sm:p-5 text-gray-900 select-none rounded-2xl bg-white/95 backdrop-blur-sm shadow-xl border border-gray-100"
                style={{ 
                  fontFamily: "var(--font-handwriting)",
                }}
              >
                <div className="flex flex-col gap-2 sm:gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 
                      className="text-2xl sm:text-3xl font-semibold leading-tight text-gray-900 underline decoration-current/30 underline-offset-4"
                      style={{ textDecorationColor: crayonColor }}
                    >
                      {step.title}
                    </h3>
                    <button
                      onClick={onClose}
                      className="p-1 hover:opacity-70 transition-opacity -mr-1 -mt-1 shrink-0"
                      aria-label="Close tour"
                    >
                      <HugeiconsIcon icon={Cancel01Icon} className="size-7 sm:size-8 opacity-40" />
                    </button>
                  </div>

                  <div className="relative">
                    <p className="text-xl sm:text-2xl font-medium leading-[1.4] text-gray-700 whitespace-pre-wrap">
                      {step.content}
                    </p>
                  </div>

                  <div className="mt-2 sm:mt-3 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm sm:text-base opacity-50 font-bold italic">
                        step {currentStepIndex + 1}/{totalSteps}
                      </span>
                      <button
                        onClick={onClose}
                        className="text-base sm:text-lg font-bold hover:underline opacity-40 transition-opacity hover:opacity-60 text-left"
                      >
                        skip tour
                      </button>
                    </div>

                    <div className="flex items-center gap-4 sm:gap-6">
                      {currentStepIndex > 0 && (
                        <button
                          onClick={handlePrevious}
                          className="text-lg sm:text-xl font-bold hover:underline opacity-60"
                        >
                          back
                        </button>
                      )}
                      <button
                        onClick={handleNext}
                        className="group relative flex items-center justify-center px-6 sm:px-10 py-2 sm:py-3"
                      >
                        <svg className="absolute inset-0 size-full overflow-visible pointer-events-none">
                          <motion.path
                            d="M 5 5 Q 55 0 115 5 Q 120 20 115 40 Q 55 45 5 40 Q 0 20 5 5"
                            fill="none"
                            stroke={crayonColor}
                            strokeWidth="2.5"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                          />
                        </svg>
                        <span className="relative text-xl sm:text-2xl font-bold">
                          {currentStepIndex === totalSteps - 1 ? "finished!" : "next!"}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <CardHeader>
                  <CardTitle>{step.title}</CardTitle>
                  <CardDescription>
                    Step {currentStepIndex + 1} of {totalSteps}
                  </CardDescription>
                  <CardAction>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                      <HugeiconsIcon icon={Cancel01Icon} />
                    </Button>
                  </CardAction>
                </CardHeader>
                <CardContent>{step.content}</CardContent>
                <CardFooter className="justify-between">
                  {currentStepIndex > 0 &&
                    (step.previousRoute ? (
                      <Button
                        variant="outline"
                        onClick={onPrevious}
                        render={<Link href={step.previousRoute} />}
                        nativeButton={false}
                      >
                        {step.previousLabel ?? "Previous"}
                      </Button>
                    ) : (
                      <Button variant="outline" onClick={onPrevious}>
                        {step.previousLabel ?? "Previous"}
                      </Button>
                    ))}
                  {step.nextRoute ? (
                    <Button
                      className="ml-auto"
                      onClick={onNext}
                      render={<Link href={step.nextRoute} />}
                      nativeButton={false}
                    >
                      {step.nextLabel ??
                        (currentStepIndex === totalSteps - 1 ? "Finish" : "Next")}
                    </Button>
                  ) : (
                    <Button className="ml-auto" onClick={onNext}>
                      {step.nextLabel ??
                        (currentStepIndex === totalSteps - 1 ? "Finish" : "Next")}
                    </Button>
                  )}
                </CardFooter>
              </>
            )}
          </PopoverContent>
        </Popover>
      )}
    </div>,
    document.body,
  );
}

export { TourProvider, useTour, type Step, type Tour };
