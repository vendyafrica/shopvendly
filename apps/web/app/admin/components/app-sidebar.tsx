"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ShoppingBag01Icon,
  Analytics02Icon,
  Message01Icon,
  UserGroupIcon,
  CustomerServiceIcon,
  Settings01Icon,
  Store01Icon,
  UserMultiple02Icon,
  GroupLayersIcon,
  Payment02Icon,
  PackageOpenIcon,
  Home01Icon,
} from "@hugeicons/core-free-icons";

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
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { StoreAvatarSimple } from "@/components/store-avatar";

import { useTenant } from "@/app/admin/context/tenant-context";

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
    title: "Transactions",
    url: "/transactions",
    icon: PackageOpenIcon,
  },
  {
    title: "Reports & Analytics",
    url: "/analytics",
    icon: Analytics02Icon,
  },
  {
    title: "Notifications",
    url: "/notifications",
    icon: Message01Icon,
  },
  {
    title: "Customers",
    url: "/customers",
    icon: CustomerServiceIcon,
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

  const storeName = bootstrap?.storeName || "Vendly";

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

                <button
                  type="button"
                  onClick={toggleSidebar}
                  className="ml-auto inline-flex size-9 items-center justify-center rounded-md hover:bg-sidebar-accent text-sidebar-foreground/80"
                  aria-label="Collapse sidebar"
                >
                  <ChevronsLeft className="size-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={toggleSidebar}
                  className="inline-flex size-9 items-center justify-center rounded-md hover:bg-sidebar-accent text-sidebar-foreground/80"
                  aria-label="Expand sidebar"
                >
                  <ChevronsRight className="size-4" />
                </button>
              </div>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
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
                      className="cursor-pointer"
                      isActive={isActive}
                      render={<Link href={fullUrl} />}
                    >
                      <HugeiconsIcon icon={item.icon} />
                      <span>{item.title}</span>
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

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            {(() => {
              const settingsUrl = basePath ? joinPaths(basePath, "/settings") : "/settings";
              const isSettingsActive = pathname === settingsUrl;
              return (
                <SidebarMenuButton
                  size="lg"
                  isActive={isSettingsActive}
                  render={<Link href={settingsUrl} />}
                >
                  <div>
                    <HugeiconsIcon icon={Settings01Icon} className="size-4" />
                  </div>
                  <span className="font-medium">Settings</span>
                </SidebarMenuButton>
              );
            })()}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
