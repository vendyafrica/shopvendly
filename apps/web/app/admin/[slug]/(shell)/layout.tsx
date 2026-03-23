import { AdminPageSkeleton } from "@/components/ui/page-skeletons";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@shopvendly/auth";
import { Suspense } from "react";
import { resolveTenantAdminAccess } from "@/modules/admin/services/access-service";
import { SidebarInset, SidebarProvider } from "@shopvendly/ui/components/sidebar";
import { Providers } from "../../../providers";
import { HeaderActionsProvider } from "@/modules/admin/context/header-actions-context";
import { TenantProvider } from "@/modules/admin/context/tenant-context";
import { AppSessionProvider, type AppSession } from "@/contexts/app-session-context";
import { AppSidebar } from "@/modules/admin/components/app-sidebar";
import { AdminMobileDock } from "@/modules/admin/components/admin-mobile-dock";
import { CollectoPayoutModal } from "@/modules/admin/components/collecto-payout-modal";

const DEMO_ADMIN_USER = {
  id: "demo-user-id",
  name: "Jane Smith",
  email: "jane.smith@example.com",
  image: null,
  createdAt: new Date().toISOString(),
};

type DemoAdminSession = {
  user: typeof DEMO_ADMIN_USER;
};

type DemoAppSession = AppSession & DemoAdminSession;

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

  const authSession = await auth.api.getSession({ headers: headerList });
  let appSession: DemoAppSession | AppSession | null = authSession;

  if (slug === "vendly" && !appSession?.user) {
    appSession = {
      user: DEMO_ADMIN_USER,
    } satisfies DemoAdminSession;
  }

  if (!appSession?.user) {
    redirect(`/admin/${slug}/login?next=${encodeURIComponent(basePath)}`);
  }

  const access = await resolveTenantAdminAccess(appSession.user.id, slug);
  const store = access.store;

  if (!store) {
    redirect("/");
  }

  if (!access.isAuthorized) {
    redirect(`/admin/${slug}/unauthorized`);
  }

  return (
    <Providers>
      <AppSessionProvider session={appSession}>
        <TenantProvider
          initialBootstrap={{
            tenantId: store.tenantId,
            storeId: store.id,
            storeSlug: slug,
            storeName: store.name,
            defaultCurrency: store.defaultCurrency,
            collectoPassTransactionFeeToCustomer: store.collectoPassTransactionFeeToCustomer ?? false,
            collectoPayoutMode: store.collectoPayoutMode ?? "automatic_per_order",
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
                <div className="flex flex-1 flex-col gap-4 p-4 pt-4 pb-24 md:pb-4">{children}</div>
              </SidebarInset>
            </HeaderActionsProvider>

            <CollectoPayoutModal />
            <AdminMobileDock basePath={basePath} />
          </SidebarProvider>
        </TenantProvider>
      </AppSessionProvider>
    </Providers>
  );
}
