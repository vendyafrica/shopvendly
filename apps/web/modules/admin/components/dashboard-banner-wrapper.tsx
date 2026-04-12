"use client";

import { useTenant } from "@/modules/admin/context/tenant-context";
import { CompleteProfileBanner } from "./complete-profile-banner";

export function DashboardBannerWrapper() {
  const { bootstrap } = useTenant();

  if (!bootstrap) {
    return null;
  }

  return (
    <CompleteProfileBanner
      storeId={bootstrap.storeId}
      storeSlug={bootstrap.storeSlug}
      isProfileComplete={bootstrap.profileComplete ?? false}
    />
  );
}
