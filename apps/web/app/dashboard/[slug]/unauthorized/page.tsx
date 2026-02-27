"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getStorefrontUrl } from "@/utils/misc";

export default function TenantUnauthorizedPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;

  useEffect(() => {
    const t = setTimeout(() => {
      router.replace(getStorefrontUrl(slug));
    }, 3000);

    return () => clearTimeout(t);
  }, [router, slug]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl p-6">
        <h1 className="text-xl font-semibold">Access denied</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You don&apos;t have permission to access this admin page.
        </p>
        <p className="mt-4 text-xs text-muted-foreground">
          Redirecting you back to the storefront…
        </p>
      </div>
    </div>
  );
}
