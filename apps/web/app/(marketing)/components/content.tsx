import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@shopvendly/ui/components/button";
import { Card, CardContent } from "@shopvendly/ui/components/card";

const workflowSteps = [
  {
    number: "01",
    title: "Set up your storefront",
    description:
      "Add your products, pricing, and delivery details once, then share a clean storefront link everywhere you sell.",
  },
  {
    number: "02",
    title: "Collect orders and payments",
    description:
      "Turn incoming DMs and link clicks into organized orders with payment tracking that keeps every sale moving.",
  },
  {
    number: "03",
    title: "Fulfill and grow with clarity",
    description:
      "Track delivery progress, follow up less, and use performance insights to keep improving your store.",
  },
];

export function Content() {
  return (
    <section className="py-24 md:py-28">
      <div className="mx-auto w-full max-w-5xl px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-muted-foreground">
            A simple three-step workflow
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
            From social post to fulfilled order without the chaos.
          </h2>
          <p className="text-muted-foreground mt-4 text-lg leading-8">
            ShopVendly gives your team a clear system for selling, collecting
            payments, and managing delivery, all in one workflow.
          </p>
        </div>

        <div className="mt-14 overflow-hidden rounded-[2rem] border border-border/60 bg-background shadow-[0_20px_80px_-50px_rgba(0,0,0,0.18)]">
          <div className="grid gap-px bg-border/60 lg:grid-cols-3">
            <Card className="rounded-none border-0 bg-background shadow-none">
              <CardContent className="flex h-full flex-col p-7 md:p-8">
                <span className="text-sm font-medium text-muted-foreground">1</span>

                <div className="mt-6 rounded-[1.75rem] border border-border/60 bg-muted/25 p-4">
                  <div className="rounded-[1.4rem] border border-border/60 bg-background p-4 shadow-sm">
                    <p className="text-sm font-medium">New campaign collection</p>
                    <p className="mt-1 text-sm text-muted-foreground">Instagram launch products</p>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-border/60 p-3">
                        <p className="text-xs text-muted-foreground">Products</p>
                        <p className="mt-1 text-sm font-medium">12 items live</p>
                      </div>
                      <div className="rounded-xl border border-border/60 p-3">
                        <p className="text-xs text-muted-foreground">Store link</p>
                        <p className="mt-1 text-sm font-medium">Ready to share</p>
                      </div>
                    </div>

                    <p className="mt-4 text-xs text-muted-foreground">
                      Connected to Instagram, TikTok, and WhatsApp selling flows.
                    </p>
                  </div>
                </div>

                <div className="mt-8">
                  <h3 className="text-xl font-semibold tracking-tight">{workflowSteps[0].title}</h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    {workflowSteps[0].description}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-none border-0 bg-background shadow-none">
              <CardContent className="flex h-full flex-col p-7 md:p-8">
                <span className="text-sm font-medium text-muted-foreground">2</span>

                <div className="mt-6 rounded-[1.75rem] border border-border/60 bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.12),transparent_62%)] p-4">
                  <div className="space-y-4 rounded-[1.4rem] border border-border/60 bg-background/95 p-4 shadow-sm backdrop-blur-sm">
                    <div className="flex items-center gap-3 text-sm">
                      <span className="size-2 rounded-full bg-primary" />
                      <span className="text-muted-foreground">06 AM</span>
                      <span className="font-medium">Customer placed an order</span>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-background px-4 py-3 shadow-sm">
                      <div className="flex -space-x-2">
                        <div className="flex size-7 items-center justify-center rounded-full border border-background bg-primary/15 text-xs font-medium text-primary">
                          A
                        </div>
                        <div className="flex size-7 items-center justify-center rounded-full border border-background bg-emerald-500/15 text-xs font-medium text-emerald-600">
                          J
                        </div>
                      </div>
                      <span className="text-sm font-medium">Payment confirmed instantly</span>
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                      <span className="size-2 rounded-full bg-emerald-500" />
                      <span className="text-muted-foreground">01 PM</span>
                      <span className="font-medium">Order moved to fulfillment</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <h3 className="text-xl font-semibold tracking-tight">{workflowSteps[1].title}</h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    {workflowSteps[1].description}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-none border-0 bg-background shadow-none">
              <CardContent className="flex h-full flex-col p-7 md:p-8">
                <span className="text-sm font-medium text-muted-foreground">3</span>

                <div className="mt-6 rounded-[1.75rem] border border-border/60 bg-muted/25 p-5">
                  <div className="rounded-[1.4rem] border border-border/60 bg-background p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium">Fulfillment progress</p>
                        <p className="mt-1 text-sm text-muted-foreground">24 of 31 orders delivered this week</p>
                      </div>
                      <span className="text-sm font-medium text-primary">77%</span>
                    </div>

                    <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full w-[77%] rounded-full bg-linear-to-r from-primary via-violet-500 to-emerald-500" />
                    </div>

                    <div className="mt-5 space-y-3 border-t border-border/60 pt-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Repeat buyers</span>
                        <span className="font-medium">+18%</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Pending deliveries</span>
                        <span className="font-medium">7 orders</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <h3 className="text-xl font-semibold tracking-tight">{workflowSteps[2].title}</h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    {workflowSteps[2].description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-5 rounded-[1.75rem] border border-border/60 bg-muted/20 px-6 py-6 md:flex-row md:items-center md:px-8">
          <div>
            <h3 className="text-xl font-semibold tracking-tight">
              Ready to run your business the easy way?
            </h3>
            <p className="mt-2 text-sm leading-7 text-muted-foreground md:text-base">
              Join sellers turning social media into an organized, profitable storefront.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button className="h-11 rounded-full px-6 shadow-lg shadow-primary/20">
              <Link href="/account" className="inline-flex items-center gap-2">
                Get Started
                <ArrowRight className="size-4" />
              </Link>
            </Button>

            <Button variant="outline" className="h-11 rounded-full px-6">
              <Link href="https://vendly.shopvendly.store/" target="_blank" rel="noreferrer">
                View Demo
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}