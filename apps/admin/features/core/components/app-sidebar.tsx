"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  adminCircleIcon,
  ShoppingBag01Icon,
  ShoppingCart01Icon,
  Analytics02Icon,
  Message01Icon,
  CustomerServiceIcon,
  Settings01Icon,
  Store01Icon,
  UserMultiple02Icon,
  GroupLayersIcon,
  Payment02Icon,
  PackageOpenIcon,
  UserShield02Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  UserGroupIcon
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
import Image from "next/image";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";

type SidebarNavSubItem = {
  title: string;
  url: string;
};

type SidebarNavItem = {
  title: string;
  url: string;
  icon: typeof adminCircleIcon;
  items?: SidebarNavSubItem[];
};

const tenantAdminItems: SidebarNavItem[] = [
  {
    title: "admin",
    url: "/",
    icon: adminCircleIcon,
  },
  {
    title: "Products",
    url: "/products",
    icon: ShoppingBag01Icon,
  },
  {
    title: "Transactions",
    url: "/transactions",
    icon: ShoppingCart01Icon,
  },
  {
    title: "Reports & Analytics",
    url: "/analytics",
    icon: Analytics02Icon,
  },
  {
    title: "Notifications",
    url: "/messages",
    icon: Message01Icon,
  },
  {
    title: "Customers",
    url: "/customers",
    icon: CustomerServiceIcon,
  },
  {
    title: "Studio",
    url: "/studio",
    icon: Store01Icon,
  },
];

const superAdminItems: SidebarNavItem[] = [
  {
    title: "admin",
    url: "/",
    icon: adminCircleIcon,
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
    title: "Invite",
    url: "/invite",
    icon: UserShield02Icon,
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
    // Remove route groups like (admin) if they ever leak in
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

function getTenantFromParams(params: ReturnType<typeof useParams>) {
  const raw = params?.tenant as string | string[] | undefined;
  return Array.isArray(raw) ? raw[0] : raw;
}

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  basePath?: string;
  variant?: "tenant" | "super";
};

export function AppSidebar({
  basePath: basePathProp,
  variant,
  ...props
}: AppSidebarProps) {
  const pathname = usePathname();
  const params = useParams();
  const { state, toggleSidebar } = useSidebar();

  // Try to get tenant from params first, then fallback to parsing basePath
  let tenant = getTenantFromParams(params);

  if (!tenant && basePathProp) {
    // basePath is usually formatted as "/tenant-slug", so we strip the leading slash
    const match = basePathProp.match(/^\/([^/]+)/);
    if (match) {
      tenant = match[1];
    }
  }

  // Ensure basePath is available for other uses
  const basePath = normalizePath(basePathProp ?? (tenant ? `/${tenant}` : ""));

  const resolvedVariant = variant ?? (tenant || basePathProp ? "tenant" : "super");

  // Select items based on resolved variant
  const items = resolvedVariant === "tenant" ? tenantAdminItems : superAdminItems;

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
                  <div className="flex aspect-square size-6 items-center justify-center rounded-lg">
                    <Image src="/vendly.png" alt="Vendly" width={24} height={24} />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">Vendly</span>
                  </div>
                </SidebarMenuButton>

                <button
                  type="button"
                  onClick={toggleSidebar}
                  className="ml-auto inline-flex size-9 items-center justify-center rounded-md hover:bg-sidebar-accent text-sidebar-foreground/80"
                  aria-label="Collapse sidebar"
                >
                  <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
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
                  <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
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
            <SidebarMenu>
              {items.map((item) => {
                const fullUrl = basePath ? joinPaths(basePath, item.url) : normalizePath(item.url);
                const isActive = item.url === "/"
                  ? pathname === fullUrl
                  : pathname === fullUrl || pathname.startsWith(fullUrl + "/");

                return (
                  <SidebarMenuItem key={item.title} >
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
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<a href="#" />}>
              <div>
                <HugeiconsIcon icon={UserShield02Icon} className="size-4" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-medium">Admin User</span>
                <span className="">admin@vendly.com</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
