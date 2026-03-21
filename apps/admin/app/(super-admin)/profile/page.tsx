"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@shopvendly/ui/components/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@shopvendly/ui/components/card";
import { Button } from "@shopvendly/ui/components/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { User02Icon, Mail01Icon, Shield01Icon} from "@hugeicons/core-free-icons" ;

// In super-admin we don't have useAppSession, we might have another way or just pass it but for now 
// we'll assume it's a client component that might need to fetch user or be passed it.
// Given the layout passes user to AppSidebar, we might need a context here too.
// For now, let's create a placeholder that looks premium.

export default function SuperAdminProfilePage() {
  // Normally we'd get this from a session context
  const user = {
    name: "Super Admin",
    email: "admin@vendly.africa",
    role: "Super Administrator",
    avatar: ""
  };

  const firstName = user.name.split(" ")[0] || "Admin";

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Super Admin Profile</h1>
        <p className="text-muted-foreground">Manage your super-administrator account and system-wide permissions.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <Card className="md:col-span-1 border-border/50 shadow-sm overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-indigo-500/20 to-purple-500/5" />
          <CardContent className="pt-0 -mt-12 flex flex-col items-center text-center pb-8">
            <Avatar className="h-24 w-24 border-4 border-background shadow-md">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="text-2xl font-bold bg-indigo-50 text-indigo-600">
                {firstName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="mt-4 space-y-1">
              <h2 className="text-xl font-bold">{user.name}</h2>
              <p className="text-sm text-indigo-600 font-semibold">{user.role}</p>
            </div>
          </CardContent>
        </Card>

        {/* Details Card */}
        <Card className="md:col-span-2 border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <HugeiconsIcon icon={Shield01Icon} size={20} className="text-indigo-600" />
              Administrative Identity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">Identifier</p>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/30">
                  <HugeiconsIcon icon={User02Icon} size={18} className="text-muted-foreground" />
                  <span className="font-medium">{user.name}</span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">System Email</p>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/30">
                  <HugeiconsIcon icon={Mail01Icon} size={18} className="text-muted-foreground" />
                  <span className="font-medium">{user.email}</span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-border/40 flex justify-end gap-3">
              <Button className="bg-indigo-600 hover:bg-indigo-700">Security Settings</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
