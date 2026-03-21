import { AdminPageSkeleton } from "@/components/ui/page-skeletons";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@shopvendly/auth";
import { Suspense } from "react";
import { resolveTenantAdminAccess } from "@/modules/admin/services/access-service";
import { SidebarInset, SidebarProvider } from "@shopvendly/ui/components/sidebar";
import { Providers } from "../../../providers";
import { AdminHeader } from "@/modules/admin/components/dashboard-header";
import { HeaderActionsProvider } from "@/modules/admin/context/header-actions-context";
import { TenantProvider } from "@/modules/admin/context/tenant-context";
import { AppSessionProvider } from "@/contexts/app-session-context";
import { AppSidebar } from "@/modules/admin/components/app-sidebar";
import { AdminMobileDock } from "@/modules/admin/components/admin-mobile-dock";

export default async function TenantAdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const basePath = `/admin/${slug}`;

  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <TenantAdminLayoutInner slug={slug} basePath={basePath}>
        {children}
      </TenantAdminLayoutInner>
    </Suspense>
  );
}

async function TenantAdminLayoutInner({
  children,
  slug,
  basePath,
}: {
  children: React.ReactNode;
  slug: string;
  basePath: string;
}) {
  const headerList = await headers();

  const session = await auth.api.getSession({ headers: headerList });

  if (!session?.user) {
    redirect(`/admin/${slug}/login?next=${encodeURIComponent(basePath)}`);
  }

  const access = await resolveTenantAdminAccess(session.user.id, slug);
  const store = access.store;

  if (!store) {
    redirect("/");
  }

  if (!access.isAuthorized) {
    redirect(`/admin/${slug}/unauthorized`);
  }

  return (
    <Providers>
      <AppSessionProvider session={{ user: session.user }}>
        <TenantProvider
          initialBootstrap={{
            tenantId: store.tenantId,
            storeId: store.id,
            storeSlug: slug,
            storeName: store.name,
            defaultCurrency: store.defaultCurrency,
          }}
        >
          <SidebarProvider
            style={
              {
                "--sidebar-width": "14rem",
              } as React.CSSProperties
            }
          >
            <AppSidebar basePath={basePath} />
            <HeaderActionsProvider>
              <SidebarInset>
                <AdminHeader tenantName={store.name} />
                <div className="flex flex-1 flex-col gap-4 p-4 pt-4 pb-24 md:pb-4">{children}</div>
              </SidebarInset>
            </HeaderActionsProvider>

            <AdminMobileDock basePath={basePath} />
          </SidebarProvider>
        </TenantProvider>
      </AppSessionProvider>
    </Providers>
  );
}
