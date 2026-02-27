"use client";

export function Step0Pricing() {
    // Pricing step temporarily disabled
    return null;

    /*
    import { Button } from "@shopvendly/ui/components/button";
    import { useOnboarding } from "../context/onboarding-context";
    import { HugeiconsIcon } from "@hugeicons/react";
    import { Tick02Icon } from "@hugeicons/core-free-icons";

    const { navigateToStep } = useOnboarding();

    const handleContinue = () => {
        navigateToStep("step1");
    };

    const freeFeatures = [
        "Instant digital storefront",
        "Unlimited products & categories",
        "Direct WhatsApp ordering integration",
        "Mobile-first management dashboard",
        "Zero transaction fees (for now)"
    ];

    return (
        <div className="w-full max-w-2xl mx-auto">
            <div className="flex w-full flex-col rounded-2xl border bg-card text-card-foreground p-4 md:p-8 shadow-sm">
                <div className="text-center space-y-1 md:space-y-2 mb-4 md:mb-6">
                    <div className="inline-flex items-center justify-center rounded-full bg-primary/10 px-2 py-0.5 md:px-3 md:py-1 text-[10px] md:text-xs font-medium text-primary mb-1 md:mb-2 whitespace-nowrap">
                        Limited Time Offer
                    </div>
                    <h2 className="text-lg md:text-2xl font-semibold text-pretty">
                        Start for Free
                    </h2>
                    <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">
                        Create your Vendly store today and get full access at no cost.
                    </p>
                </div>

                <div className="flex justify-center mb-4 md:mb-6">
                    <span className="text-sm md:text-lg font-semibold mt-1">$</span>
                    <span className="text-4xl md:text-6xl font-semibold tracking-tighter">0</span>
                    <span className="self-end text-xs md:text-sm text-muted-foreground mb-1 md:mb-2 ml-1">/mo</span>
                </div>

                <div className="mb-4 md:mb-6 flex-1">
                    <ul className="flex flex-col gap-2.5 md:gap-3.5">
                        {freeFeatures.map((feature, i) => (
                            <li
                                key={i}
                                className="flex items-start gap-2 md:gap-3 text-xs md:text-sm font-medium"
                            >
                                <div className="mt-0.5 rounded-full bg-primary/20 p-0.5 md:p-1 shrink-0">
                                    <HugeiconsIcon icon={Tick02Icon} className="h-2.5 w-2.5 md:h-3 md:w-3 text-primary" strokeWidth={2.5} />
                                </div>
                                <span className="leading-snug">{feature}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <Button
                    type="button"
                    variant="default"
                    onClick={handleContinue}
                    className="w-full mt-auto h-9 text-xs md:h-11 md:text-base"
                >
                    Get Started <span className="hidden sm:inline">&mdash; It's Free</span>
                </Button>
            </div>
        </div>
    );
    */
}
