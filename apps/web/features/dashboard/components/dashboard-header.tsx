"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@shopvendly/ui/components/avatar";
import { Button } from "@shopvendly/ui/components/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@shopvendly/ui/components/dropdown-menu";
import { useAppSession } from "@/contexts/app-session-context";
import { signOut } from "@shopvendly/auth/react";
import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTenant } from "../tenant-context";
import { useHeaderActions } from "./header-actions-context";
import { getStorefrontUrl } from "@/utils/misc";

export function dashboard-header({
  title = "Dashboard",
  tenantName,
}: {
  title?: string;
  tenantName?: string | null;
}) {
  const { session } = useAppSession();
  const router = useRouter();
  const { bootstrap } = useTenant();
  const { actions } = useHeaderActions();

  const fullName = session?.user?.name || "Admin";
  const firstName = fullName.split(" ")[0];
  const avatarUrl = session?.user?.image || "";
  const resolvedTenantName = tenantName || "Store";
  const storefrontUrl = bootstrap?.storeSlug ? getStorefrontUrl(bootstrap.storeSlug) : "/";

  const handleSignOut = async () => {
    await signOut();
    router.push(storefrontUrl);
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b bg-background/80 px-4 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-semibold text-muted-foreground">Welcome to {resolvedTenantName}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {actions}
        <Button variant="ghost" size="icon-sm" className="rounded-full">
          <Bell className="size-4" />
          <span className="sr-only">Notifications</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger className="outline-none ring-offset-2 ring-offset-background focus-visible:ring-2 ring-ring rounded-full">
            <div className="group p-0.5 rounded-full hover:bg-muted/70 active:scale-95 transition-all">
              <Avatar className="h-7 w-7">
                <AvatarImage src={avatarUrl} alt={fullName} />
                <AvatarFallback className="text-xs font-semibold">
                  {firstName.charAt(0) || "A"}
                </AvatarFallback>
              </Avatar>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-40">
            <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
