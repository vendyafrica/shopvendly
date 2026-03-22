"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useTenant } from "@/modules/admin/context/tenant-context";
import { type OrderWithItems } from "@/modules/orders/lib/order-models";
import { Button } from "@shopvendly/ui/components/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  ShoppingBag01Icon,
  UserIcon,
  Tick01Icon,
  PackageIcon,
  CreditCardIcon,
  InformationCircleIcon,
} from "@hugeicons/core-free-icons";
import { Badge } from "@shopvendly/ui/components/badge";
import { cn } from "@shopvendly/ui/lib/utils";

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { bootstrap } = useTenant();
  const [order, setOrder] = React.useState<OrderWithItems | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const orderId = params.orderId as string;

  React.useEffect(() => {
    async function fetchOrder() {
      if (!orderId) return;
      setIsLoading(true);
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        if (!res.ok) throw new Error("Order not found");
        const data = await res.json();
        setOrder(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load order");
      } finally {
        setIsLoading(false);
      }
    }
    void fetchOrder();
  }, [orderId]);

  if (isLoading) {
    return (
      <div className="flex-1 p-8 space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
             <div className="h-40 bg-muted rounded-2xl" />
             <div className="h-60 bg-muted rounded-2xl" />
          </div>
          <div className="space-y-4">
             <div className="h-32 bg-muted rounded-2xl" />
             <div className="h-32 bg-muted rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4">
        <HugeiconsIcon icon={InformationCircleIcon} className="size-12 text-muted-foreground opacity-20" />
        <div className="text-center">
          <p className="font-semibold">{error || "Order not found"}</p>
          <Button variant="link" onClick={() => router.back()}>Go back</Button>
        </div>
      </div>
    );
  }

  const currency = order.currency || "UGX";
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 0 }).format(amount);

  const renderPrice = (amount: number, className?: string) => {
    const formatted = formatCurrency(amount);
    const match = formatted.match(/^([A-Z]{3})[\s\u00a0]*(.*)$/);
    if (!match) return <span className={className}>{formatted}</span>;
    const [, code, numeric] = match;
    return (
      <span className={cn("inline-flex items-baseline gap-1", className)}>
        <span className="text-[10px] font-bold text-muted-foreground/60 align-sub tracking-tight uppercase leading-none">{code}</span>
        <span className="leading-none">{numeric}</span>
      </span>
    );
  };

  return (
    <div className="flex-1 space-y-6 px-4 py-4 md:px-8 md:py-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.back()}
            className="h-8 w-8 p-0 rounded-full"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} className="size-5" />
          </Button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight">{order.orderNumber}</h1>
            <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-0 hover:bg-emerald-100 rounded-lg px-2 text-[10px] font-bold uppercase tracking-wider">
               {order.status.replace(/_/g, " ")}
            </Badge>
            <span className="text-xs text-muted-foreground font-medium">
               {new Date(order.createdAt).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Items Card */}
          <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden h-full flex flex-col">
            <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between">
               <h3 className="text-sm font-bold flex items-center gap-2">
                  <HugeiconsIcon icon={ShoppingBag01Icon} className="size-4 text-primary" />
                  Items
               </h3>
               <span className="text-xs text-muted-foreground font-medium">{order.items.length} items</span>
            </div>
            <div className="divide-y divide-border/40 flex-1">
               {order.items.map((item, i) => (
                 <div key={item.id} className="px-6 py-4 flex gap-4 items-center">
                    <div className="size-12 rounded-xl bg-muted/30 border border-border/40 flex items-center justify-center shrink-0 overflow-hidden">
                       {item.productImage ? (
                          <img src={item.productImage} alt={item.productName || "Product"} className="size-full object-cover" />
                       ) : (
                          <HugeiconsIcon icon={PackageIcon} className="size-5 text-muted-foreground opacity-40" />
                       )}
                    </div>
                    <div className="flex-1 min-w-0">
                       <p className="text-sm font-semibold truncate">{item.productName || "Unknown Product"}</p>
                       <p className="text-xs text-muted-foreground font-medium">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                       <div className="text-sm font-bold">{renderPrice(item.totalPrice)}</div>
                       <div className="text-[10px] text-muted-foreground font-medium">{renderPrice(item.unitPrice)} each</div>
                    </div>
                 </div>
               ))}
            </div>
            <div className="bg-muted/5 px-6 py-4 space-y-2 mt-auto">
               <div className="flex justify-between text-xs font-bold text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{renderPrice(order.subtotal)}</span>
               </div>
               <div className="flex justify-between text-sm font-semibold pt-1 border-t border-border/40 overflow-hidden">
                  <span>Total</span>
                  {renderPrice(order.totalAmount, "text-red-400 font-bold")}
               </div>
            </div>
          </div>
        </div>

        {/* Sidebar Middle Row: Customer Info */}
        <div className="h-full">
           {/* Customer Card */}
           <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden h-full flex flex-col">
              <div className="px-6 py-4 border-b border-border/40">
                 <h3 className="text-sm font-bold flex items-center gap-2">
                    <HugeiconsIcon icon={UserIcon} className="size-4 text-blue-600" />
                    Customer Details
                 </h3>
              </div>
              <div className="p-6 space-y-5 flex-1">
                 <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 px-0.5">Name</p>
                    <p className="text-sm font-medium bg-muted/20 px-3 py-2 rounded-xl border border-border/40">{order.customerName}</p>
                 </div>
                 <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 px-0.5">Email</p>
                    <p className="text-sm font-medium text-primary/80 bg-muted/20 px-3 py-2 rounded-xl border border-border/40 truncate">{order.customerEmail || "No email provided"}</p>
                 </div>
                 <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 px-0.5">Phone</p>
                    <p className="text-sm font-medium bg-muted/20 px-3 py-2 rounded-xl border border-border/40">{order.customerPhone || "—"}</p>
                 </div>
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* Payment Card */}
          <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden h-full flex flex-col">
            <div className="px-6 py-4 border-b border-border/40">
               <h3 className="text-sm font-bold flex items-center gap-2">
                  <HugeiconsIcon icon={CreditCardIcon} className="size-4 text-emerald-600" />
                  Payment Information
               </h3>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6 flex-1 items-center">
               <div className="bg-muted/20 p-4 rounded-2xl border border-border/40">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Status</p>
                  <p className="text-sm font-bold capitalize text-emerald-600 flex items-center gap-1.5">
                     <span className="size-1.5 rounded-full bg-emerald-600 animate-pulse" />
                     {order.paymentStatus}
                  </p>
               </div>
               <div className="bg-muted/20 p-4 rounded-2xl border border-border/40">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Method</p>
                  <p className="text-sm font-medium uppercase">{order.paymentMethod.replace(/_/g, " ")}</p>
               </div>
            </div>
          </div>

           {/* Delivery Card */}
           <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden h-full flex flex-col">
              <div className="px-6 py-4 border-b border-border/40">
                 <h3 className="text-sm font-bold flex items-center gap-2">
                    <HugeiconsIcon icon={PackageIcon} className="size-4 text-amber-600" />
                    Delivery Information
                 </h3>
              </div>
              <div className="p-6 space-y-4 flex-1 flex flex-col justify-center">
                 <div className="bg-muted/20 p-4 rounded-2xl border border-border/40">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Address</p>
                    <p className="text-sm font-medium leading-relaxed">{order.deliveryAddress || "Self-collection / Pickup"}</p>
                 </div>
                 {order.notes && (
                   <div className="bg-muted/20 p-4 rounded-2xl border border-border/40">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Notes</p>
                      <p className="text-xs italic text-muted-foreground font-medium">{order.notes}</p>
                   </div>
                 )}
              </div>
           </div>
      </div>
    </div>
  );
}
