"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  CreditCardIcon,
  DeliveryTruck01Icon,
  LoginSquare02Icon,
  Search01Icon,
  ShoppingBag01Icon,
  Store02Icon,
} from "@hugeicons/core-free-icons";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@shopvendly/ui/components/chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shopvendly/ui/components/card";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

const featureChartData = [
  { month: "Jan", orders: 18, revenue: 10 },
  { month: "Feb", orders: 26, revenue: 16 },
  { month: "Mar", orders: 22, revenue: 14 },
  { month: "Apr", orders: 34, revenue: 24 },
  { month: "May", orders: 29, revenue: 21 },
  { month: "Jun", orders: 46, revenue: 33 },
];

const featureChartConfig = {
  orders: {
    label: "Orders",
    color: "#7c3aed",
  },
  revenue: {
    label: "Revenue",
    color: "#14b8a6",
  },
} satisfies ChartConfig;

const supportingFeatures = [
  {
    title: "All orders in one workspace",
    description:
      "Capture Instagram and TikTok orders, confirm faster, and keep every customer request in one clean flow.",
    icon: ShoppingBag01Icon,
  },
  {
    title: "Seamless payments",
    description:
      "Send checkout links, track confirmations, and reduce the back-and-forth around payment screenshots.",
    icon: CreditCardIcon,
  },
  {
    title: "Automated delivery",
    description:
      "Coordinate delivery updates from order confirmation to doorstep without managing every step manually.",
    icon: DeliveryTruck01Icon,
  },
  {
    title: "Instant storefront",
    description:
      "Turn your page into a shareable storefront your customers can browse anytime, without custom development.",
    icon: Store02Icon,
  },
  {
    title: "Marketplace discovery",
    description:
      "Reach buyers beyond your followers by listing products where shoppers are already searching.",
    icon: Search01Icon,
  },
  {
    title: "Clear business insights",
    description:
      "See what is selling, where orders come from, and how your storefront is performing at a glance.",
    icon: LoginSquare02Icon,
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 md:py-28">
      <div className="mx-auto w-full max-w-5xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-muted-foreground">
            Built for how social sellers actually work
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
            Everything you need to run your social business in one place.
          </h2>
          <p className="text-muted-foreground mt-4 text-lg leading-8">
            Stop juggling DMs, spreadsheets, payment proof, and delivery updates.
            ShopVendly gives you one system to sell, manage, and grow.
          </p>
        </div>

        <div id="solution" className="mt-16 grid gap-0 overflow-hidden rounded-[2rem] border border-border/60 bg-background shadow-[0_20px_80px_-50px_rgba(0,0,0,0.18)] lg:grid-cols-2">
          <Card className="rounded-none border-0 shadow-none">
            <CardHeader className="space-y-3 p-8 pb-2 md:p-10 md:pb-4">
              <CardTitle className="text-xl font-semibold">
                Powerful analytics dashboard
              </CardTitle>
              <CardDescription className="max-w-md text-base leading-7">
                Track orders and revenue in one view so you can see what is growing,
                what needs attention, and when to act.
              </CardDescription>
              <div className="flex items-end justify-between gap-6 pt-4">
                <div>
                  <p className="text-3xl font-semibold tracking-tight">UGX 12.4M</p>
                  <p className="text-sm text-muted-foreground">Revenue processed this month</p>
                </div>
                <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  +18.4% this month
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-3 pb-3 md:px-5 md:pb-5">
              <ChartContainer config={featureChartConfig} className="aspect-auto h-72 w-full md:h-80">
                <AreaChart
                  accessibilityLayer
                  data={featureChartData}
                  margin={{ left: 8, right: 8, top: 16, bottom: 0 }}
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.18} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={28}
                    tickMargin={6}
                    tick={{ fontSize: 11 }}
                  />
                  <ChartTooltip
                    cursor={{ stroke: "hsl(var(--border))", strokeDasharray: "4 4", opacity: 0.8 }}
                    content={<ChartTooltipContent indicator="line" />}
                  />
                  <defs>
                    <linearGradient id="featureOrders" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.34} />
                      <stop offset="60%" stopColor="#7c3aed" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="featureRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.28} />
                      <stop offset="60%" stopColor="#14b8a6" stopOpacity={0.16} />
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="orders"
                    stroke="#7c3aed"
                    strokeWidth={2.5}
                    fill="url(#featureOrders)"
                    dot={{ r: 0, strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: "#7c3aed", stroke: "white", strokeWidth: 2 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#14b8a6"
                    strokeWidth={2}
                    fill="url(#featureRevenue)"
                    dot={{ r: 0, strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: "#14b8a6", stroke: "white", strokeWidth: 2 }}
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="rounded-none border-0 border-t shadow-none lg:border-l lg:border-t-0">
            <CardHeader className="space-y-3 p-8 pb-4 md:p-10 md:pb-6">
              <CardTitle className="text-xl font-semibold">
                Streamlined order to payment flow
              </CardTitle>
              <CardDescription className="max-w-md text-base leading-7">
                Keep checkout, payment confirmation, and delivery status connected so sellers and customers always know what is next.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0 md:px-10 md:pb-10">
              <div className="rounded-[1.75rem] border border-border/60 bg-muted/30 p-6 md:p-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                      Order #SV-45789
                    </p>
                    <p className="mt-3 text-3xl font-semibold tracking-tight">UGX 284,000</p>
                    <p className="mt-2 text-sm text-muted-foreground">Paid and ready for dispatch</p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-background p-3 shadow-sm">
                    <div className="space-y-2">
                      <div className="h-2 w-12 rounded-full bg-muted" />
                      <div className="h-2 w-10 rounded-full bg-muted" />
                      <div className="h-2 w-14 rounded-full bg-muted" />
                    </div>
                  </div>
                </div>

                <div className="mt-8 space-y-4">
                  {[
                    { label: "Customer", value: "Confirmed from Instagram DM" },
                    { label: "Payment", value: "Mobile money collected instantly" },
                    { label: "Delivery", value: "Rider assigned with live updates" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between gap-4 rounded-2xl border border-border/50 bg-background/90 px-4 py-3">
                      <span className="text-sm text-muted-foreground">{item.label}</span>
                      <span className="text-sm font-medium text-right">{item.value}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-8 rounded-2xl border border-primary/15 bg-primary/5 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">Average order handling time</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Faster fulfillment with fewer manual follow-ups.
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-semibold">12 min</p>
                      <p className="text-xs text-primary">-32% faster</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-10 grid gap-px overflow-hidden rounded-[2rem] border border-border/60 bg-border/60 sm:grid-cols-2 lg:grid-cols-3">
          {supportingFeatures.map((feature) => (
            <Card key={feature.title} className="rounded-none border-0 bg-background shadow-none">
              <CardContent className="space-y-4 p-6 md:p-7">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/8 text-primary">
                  <HugeiconsIcon icon={feature.icon} className="size-5" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium tracking-tight">{feature.title}</h3>
                  <p className="text-sm leading-7 text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}