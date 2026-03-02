import { Suspense } from "react";
import { redirect } from "next/navigation";
import { LoginForm } from "./(auth)/components/login-form";
import { getSession } from "../lib/auth-guard";

export const metadata = {
  title: "Vendly Admin",
  description: "Manage tenants, stores, orders, and platform settings",
};

export default async function Home() {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
