import { auth } from "@shopvendly/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { adminRepo } from "@/modules/admin/repo/admin-repo";
import { storeRepo } from "@/modules/storefront/repo/store-repo";

export default async function AdminCallbackPage() {
  const headerList = await headers();
  const session = await auth.api.getSession({ headers: headerList });

  if (!session?.user) {
    redirect("/admin/login");
  }

  const memberships = await adminRepo.findMembershipsByUserId(session.user.id);

  if (!memberships.length) {
    redirect("/admin/login?error=no-store");
  }

  const store = await storeRepo.findFirstByTenantId(memberships[0]!.tenantId);

  if (!store?.slug) {
    redirect("/admin/login?error=no-store");
  }

  redirect(`/admin/${store.slug}`);
}
