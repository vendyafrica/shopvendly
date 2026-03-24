"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ShoppingBag01Icon,
  Analytics02Icon,
  UserGroupIcon,
  CustomerServiceIcon,
  Settings01Icon,
  Store01Icon,
  UserMultiple02Icon,
  GroupLayersIcon,
  Payment02Icon,
  PackageOpenIcon,
  Notification01Icon,
  Home01Icon,
  Logout01Icon,
  SidebarLeft01Icon,
  SidebarRight01Icon
} from "@hugeicons/core-free-icons";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@shopvendly/ui/components/avatar";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@shopvendly/ui/components/sidebar";
import { cn } from "@shopvendly/ui/lib/utils";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { StoreAvatarSimple } from "@/components/store-avatar";

import { useTenant } from "@/modules/admin/context/tenant-context";
import { useAppSession } from "@/contexts/app-session-context";
import { signOut } from "@shopvendly/auth/react";
import { useRouter } from "next/navigation";
import { getStorefrontUrl } from "@/utils/misc";

type SidebarNavSubItem = {
  title: string;
  url: string;
};

type SidebarNavItem = {
  title: string;
  url: string;
  icon: typeof Home01Icon;
  items?: SidebarNavSubItem[];
};

const tenantAdminItems: SidebarNavItem[] = [
  {
    title: "Home",
    url: "/",
    icon: Home01Icon,
  },
  {
    title: "Products",
    url: "/products",
    icon: ShoppingBag01Icon,
  },
  {
    title: "Collections",
    url: "/collections",
    icon: GroupLayersIcon,
  },
  {
    title: "Orders",
    url: "/orders",
    icon: PackageOpenIcon,
  },
  {
    title: "Payments",
    url: "/payments",
    icon: Payment02Icon,
  },
  {
    title: "Activity",
    url: "/activity",
    icon: Notification01Icon,
  },
  {
    title: "Customers",
    url: "/customers",
    icon: CustomerServiceIcon,
  },
  {
    title: "Reports & Analytics",
    url: "/analytics",
    icon: Analytics02Icon,
  }, 
];

const superAdminItems: SidebarNavItem[] = [
  {
    title: "Home",
    url: "/",
    icon: Home01Icon,
  },
  {
    title: "Tenants",
    url: "/tenants",
    icon: UserMultiple02Icon,
  },
  {
    title: "Stores",
    url: "/stores",
    icon: Store01Icon,
  },
  {
    title: "Categories",
    url: "/categories",
    icon: GroupLayersIcon,
  },
  {
    title: "Users",
    url: "/users",
    icon: UserGroupIcon,
  },
  {
    title: "Payments",
    url: "/payments",
    icon: Payment02Icon,
  },
  {
    title: "Orders",
    url: "/orders",
    icon: PackageOpenIcon,
  },
  {
    title: "Reports & Analytics",
    url: "/analytics",
    icon: Analytics02Icon,
  },
];

function normalizePath(path: string) {
  const resolved = path
    // Remove route groups like (Admin) if they ever leak in
    .replace(/\/\([^)]+\)/g, "")
    // Collapse multiple slashes
    .replace(/\/+/g, "/")
    // Remove trailing slash (except for root)
    .replace(/\/$/, "");

  return resolved === "" ? "/" : resolved;
}

function joinPaths(a: string, b: string) {
  const left = a.endsWith("/") ? a.slice(0, -1) : a;
  const right = b.startsWith("/") ? b : `/${b}`;
  return normalizePath(`${left}${right}`);
}

function getSlugFromParams(params: ReturnType<typeof useParams>) {
  const raw = params?.slug as string | string[] | undefined;
  return Array.isArray(raw) ? raw[0] : raw;
}

export function AppSidebar({
  basePath: basePathProp,
  ...props
}: React.ComponentProps<typeof Sidebar> & { basePath?: string }) {
  const pathname = usePathname();
  const params = useParams();
  const { state, toggleSidebar } = useSidebar();
  const { bootstrap } = useTenant();
  const { session } = useAppSession();
  const router = useRouter();

  const isVendly = bootstrap?.storeSlug === "vendly";
  const fullName = isVendly ? "Jane Smith" : (session?.user?.name || "Admin");
  const firstName = fullName.split(" ")[0] ?? "A";
  const avatarUrl = isVendly ? "" : (session?.user?.image || "");
  const storeName = bootstrap?.storeName || "Vendly";
  const storefrontUrl = bootstrap?.storeSlug ? getStorefrontUrl(bootstrap.storeSlug) : "/";
  const isDemoSession = isVendly && session?.user?.id === "demo-user-id";

  const handleSignOut = async () => {
    if (isDemoSession) {
      router.push(storefrontUrl);
      return;
    }

    await signOut();
    router.push(storefrontUrl);
  };

  const handleToggleKeyDown = (
    event: React.KeyboardEvent<HTMLSpanElement>
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleSidebar();
    }
  };

  // Try to get slug from params first, then fallback to parsing basePath
  let slug = getSlugFromParams(params);

  if (!slug && basePathProp) {
    // basePath is usually formatted as "/admin/store-slug", so we strip the leading segments
    const match = basePathProp.match(/^\/admin\/([^/]+)/) || basePathProp.match(/^\/([^/]+)/);
    if (match) {
      slug = match[1];
    }
  }

  // Ensure basePath is available for other uses
  const basePath = normalizePath(basePathProp ?? (slug ? `/admin/${slug}` : ""));

  // Select items based on whether we are in a store context
  const items = slug || basePathProp ? tenantAdminItems : superAdminItems;

  return (
    <Sidebar variant="inset" collapsible="icon" {...props} className="cursor-pointer">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            {state === "expanded" ? (
              <div className="flex items-center gap-1">
                <SidebarMenuButton
                  size="lg"
                  render={<Link href={basePath || "/"} />}
                >
                  <StoreAvatarSimple storeName={storeName} size={24} className="rounded-sm" />
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{storeName}</span>
                  </div>
                </SidebarMenuButton>

                <span
                  role="button"
                  tabIndex={0}
                  onClick={toggleSidebar}
                  onKeyDown={handleToggleKeyDown}
                  className="ml-auto inline-flex size-9 items-center justify-center rounded-md text-sidebar-foreground/80"
                  aria-label="Collapse sidebar"
                >
                  <HugeiconsIcon icon={SidebarLeft01Icon} className="size-5 text-red-700 hover:text-red-500" />
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <span
                  role="button"
                  tabIndex={0}
                  onClick={toggleSidebar}
                  onKeyDown={handleToggleKeyDown}
                  className="inline-flex size-9 items-center justify-center rounded-md text-sidebar-foreground/80"
                  aria-label="Expand sidebar"
                >
                  <HugeiconsIcon icon={SidebarRight01Icon} className="size-5 text-green-500 hover:text-green-700" />
                </span>
              </div>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="px-3">
          <SidebarGroupLabel className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.15em]">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {items.map((item) => {
                const fullUrl = basePath ? joinPaths(basePath, item.url) : normalizePath(item.url);
                const isActive = item.url === "/"
                  ? pathname === fullUrl
                  : pathname === fullUrl || pathname.startsWith(fullUrl + "/");

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      className={cn(
                        "h-9 px-3 transition-all duration-200 hover:bg-sidebar-accent/50",
                        isActive && "bg-sidebar-accent/80 font-semibold text-primary shadow-sm"
                      )}
                      render={<Link href={fullUrl} />}
                    >
                      <HugeiconsIcon
                        icon={item.icon}
                        size={20}
                        className={cn("transition-colors", isActive ? "text-primary" : "text-muted-foreground")}
                      />
                      <span className="text-[14px] leading-none">{item.title}</span>
                    </SidebarMenuButton>
                    {item.items?.length ? (
                      <SidebarMenuSub className="ml-0 border-l-0 px-1.5 cursor-pointer">
                        {item.items.map((subItem) => {
                          const subFullUrl = basePath
                            ? joinPaths(basePath, subItem.url)
                            : normalizePath(subItem.url);
                          const isSubActive = pathname === subFullUrl;

                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                isActive={isSubActive}
                                render={<Link href={subFullUrl} />}
                              >
                                {subItem.title}
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    ) : null}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2 pb-4 border-t border-sidebar-border/50 bg-sidebar/50">
        <SidebarMenu className="gap-1">
          {/* Profile Item */}
          <SidebarMenuItem>
            {(() => {
              const profileUrl = basePath ? joinPaths(basePath, "/profile") : "/profile";
              const isProfileActive = pathname === profileUrl;
              return (
                <SidebarMenuButton
                  size="lg"
                  isActive={isProfileActive}
                  render={<Link href={profileUrl} />}
                  className={cn(
                    "h-10 w-full px-3 hover:bg-sidebar-accent/50 transition-all",
                    isProfileActive && "bg-sidebar-accent/80 font-semibold text-primary shadow-sm"
                  )}
                >
                  <Avatar className="h-6 w-6 rounded-full border border-border/50 ring-2 ring-background">
                    <AvatarImage src={avatarUrl} alt={fullName} />
                    <AvatarFallback className="text-[10px] font-bold">
                      {firstName.charAt(0) || "A"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-[14px] ml-2 font-medium">Profile</span>
                </SidebarMenuButton>
              );
            })()}
          </SidebarMenuItem>

          {/* Settings Item */}
          <SidebarMenuItem>
            {(() => {
              const settingsUrl = basePath ? joinPaths(basePath, "/settings") : "/settings";
              const isSettingsActive = pathname === settingsUrl;
              return (
                <SidebarMenuButton
                  size="lg"
                  isActive={isSettingsActive}
                  render={<Link href={settingsUrl} />}
                  className={cn(
                    "h-10 w-full px-3 hover:bg-sidebar-accent/50 transition-all",
                    isSettingsActive && "bg-sidebar-accent/80 font-semibold text-primary shadow-sm"
                  )}
                >
                  <HugeiconsIcon icon={Settings01Icon} size={18} className={cn("transition-colors", isSettingsActive ? "text-primary" : "text-muted-foreground")} />
                  <span className="text-[14px] ml-2 font-medium">Settings</span>
                </SidebarMenuButton>
              );
            })()}
          </SidebarMenuItem>

          {/* Logout Item */}
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              onClick={handleSignOut}
              disabled={isDemoSession}
              className="h-10 w-full px-3 hover:bg-rose-50/50 text-rose-600 transition-all hover:text-rose-700 font-medium group"
            >
              <HugeiconsIcon icon={Logout01Icon} size={18} className="group-hover:translate-x-0.5 transition-transform" />
              <span className="text-[14px] ml-2">Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
