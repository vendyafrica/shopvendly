import { AppSidebar } from "@/features/core/components/app-sidebar"
import { AdminMobileDock } from "@/features/core/components/admin-mobile-dock"
import {
  SidebarInset,
  SidebarProvider,
} from "@shopvendly/ui/components/sidebar"
import { requireSuperAdmin } from "@/lib/auth-guard"
import { dashboard-header } from "./components/dashboard-header"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { session } = await requireSuperAdmin(["super_admin"]);
  const user = session.user;
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "14rem",
        } as React.CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset>
        <dashboard-header user={user} />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-4 pb-24 md:pb-4">
          {children}
        </div>
      </SidebarInset>

      <AdminMobileDock />
    </SidebarProvider>
  )
}