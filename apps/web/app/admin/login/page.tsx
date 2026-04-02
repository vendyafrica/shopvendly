import { SellerLoginForm } from "../[slug]/login/seller-login-form";
import { auth } from "@shopvendly/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function AdminLoginPage() {
  const headerList = await headers();
  const session = await auth.api.getSession({ headers: headerList });

  if (session?.user) {
    redirect("/admin/callback");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-xl">
        <SellerLoginForm
          title="Store Admin Login"
          redirectTo="/admin/callback"
        />
      </div>
    </div>
  );
}
