import { SellerLoginForm } from "./seller-login-form";
import { auth } from "@shopvendly/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getRootUrl } from "@/shared/utils/misc";
import { resolveTenantAdminAccess } from "@/modules/admin/services/access-service";

export default async function TenantAdminLoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ next?: string; verified?: string; error?: string }>;
}) {
  const { slug } = await params;
  const { next, verified, error } = await searchParams;
  const adminPath = `/admin/${slug}`;

  if (slug === "vendly") {
    const safeNext = next && next.startsWith(adminPath) ? next : `${adminPath}/`;
    redirect(safeNext);
  }

  const headerList = await headers();
  const session = await auth.api.getSession({ headers: headerList });
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const proto = headerList.get("x-forwarded-proto") ?? "https";
  const origin = host ? `${proto}://${host}` : getRootUrl();
  const base = `${origin}${adminPath}`;

  if (session?.user) {
    const access = await resolveTenantAdminAccess(session.user.id, slug);

    if (access.isAuthorized) {
      const safeNext = next && next.startsWith(adminPath) ? next : `${adminPath}/`;
      redirect(safeNext);
    }

    await auth.api.revokeSession({
      headers: headerList,
      body: { token: session.session.token },
    });

    const loginUrl = `${adminPath}/login${next ? `?next=${encodeURIComponent(next)}&error=wrong-account` : "?error=wrong-account"}`;
    redirect(loginUrl);
  }

  const redirectTo = next && next.startsWith(adminPath) ? `${origin}${next}` : base;
  const title = `Welcome to ${slug} Admin`;

  return (
    <div className="relative min-h-screen bg-gray-50 p-4 flex items-center justify-center">
      <div className="relative z-10 w-full bg-white shadow-xl rounded-t-2xl p-6 pb-12 sm:max-w-md sm:rounded-xl sm:p-8 sm:pb-8 sm:mb-0">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-muted sm:hidden" />
        {verified === "true" && (
          <div className="mb-4 rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-800">
            Your email has been verified! Sign in below to access your Admin.
          </div>
        )}
        {error === "wrong-account" && (
          <div className="mb-4 rounded-md bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
            You&apos;re not authorized for this store. Please sign in with the correct Google account.
          </div>
        )}
        {error && error !== "wrong-account" && (
          <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800">
            {error === "link-expired"
              ? "Your verification link has expired. Please request a new one."
              : error === "invalid-or-expired-link"
                ? "This verification link is invalid or has already been used."
                : "Something went wrong. Please try again."}
          </div>
        )}
        <SellerLoginForm title={title} redirectTo={redirectTo} />
      </div>
    </div>
  );
}

