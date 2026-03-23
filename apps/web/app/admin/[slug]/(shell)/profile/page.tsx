"use client";

import { useAppSession } from "@/contexts/app-session-context";
import { useParams } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@shopvendly/ui/components/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@shopvendly/ui/components/card";
import { Button } from "@shopvendly/ui/components/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { User02Icon, Mail01Icon, Calendar03Icon } from "@hugeicons/core-free-icons";

export default function ProfilePage() {
  const { session } = useAppSession();
  const params = useParams();
  const user = session?.user;
  const isVendly = params.slug === "vendly";

  if (!user && !isVendly) return null;

  const fullName = isVendly ? "Jane Smith" : (user?.name || "Admin User");
  const firstName = fullName.split(" ")[0] || "A";
  const avatarUrl = isVendly ? "" : (user?.image || "");

  const memberSince = isVendly 
    ? "March 2026"
    : (user?.createdAt
      ? new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date(user.createdAt))
      : "—");
  
  const email = isVendly ? "jane.smith@example.com" : user?.email;

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Your Profile</h1>
        <p className="text-muted-foreground">Manage your personal information and account security.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <Card className="md:col-span-1 border-border/50 shadow-sm overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-primary/20 to-primary/5" />
          <CardContent className="pt-0 -mt-12 flex flex-col items-center text-center pb-8">
            <Avatar className="h-24 w-24 border-4 border-background shadow-md">
              <AvatarImage src={avatarUrl} alt={fullName} />
              <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                {firstName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="mt-4 space-y-1">
              <h2 className="text-xl font-bold">{fullName}</h2>
              <p className="text-sm text-muted-foreground font-medium">Administrator</p>
            </div>
            <div className="mt-6 w-full pt-6 border-t border-border/40 grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">Status</div>
                <div className="mt-1 text-sm font-semibold text-emerald-600">Active</div>
              </div>
              <div className="text-center">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">Role</div>
                <div className="mt-1 text-sm font-semibold text-blue-600">Admin</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details Card */}
        <Card className="md:col-span-2 border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <HugeiconsIcon icon={User02Icon} size={20} className="text-primary" />
              Account Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">Full Name</p>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/30">
                  <HugeiconsIcon icon={User02Icon} size={18} className="text-muted-foreground" />
                  <span className="font-medium">{fullName}</span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">Email Address</p>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/30">
                  <HugeiconsIcon icon={Mail01Icon} size={18} className="text-muted-foreground" />
                  <span className="font-medium">{email}</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">Member Since</p>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/30">
                  <HugeiconsIcon icon={Calendar03Icon} size={18} className="text-muted-foreground" />
                  <span className="font-medium">{memberSince}</span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-border/40 flex justify-end gap-3">
              <Button variant="outline">Reset Password</Button>
              <Button disabled>Edit Profile</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
