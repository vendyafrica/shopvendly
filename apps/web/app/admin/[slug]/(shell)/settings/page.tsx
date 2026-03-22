import { storeRepo } from "@/repo/store-repo";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const store = await storeRepo.findAdminSettingsBySlug(slug);

  if (!store) {
    return (
      <div className="space-y-6 p-6">
        <div className="rounded-md border bg-card p-6 text-sm text-muted-foreground">Store not found.</div>
      </div>
    );
  }

  return (
    <SettingsClient
      store={{
        id: store.id,
        name: store.name,
        storeContactPhone: store.storeContactPhone,
        defaultCurrency: store.defaultCurrency || "UGX",
        slug: store.slug,
        tenantId: store.tenantId,
        heroMedia: Array.isArray(store.heroMedia) ? store.heroMedia : [],
        storePolicy: store.storePolicy ?? "",
        logoUrl: store.logoUrl ?? null,
        collectoPassTransactionFeeToCustomer: store.collectoPassTransactionFeeToCustomer ?? false,
        collectoPayoutMode: store.collectoPayoutMode === "manual_batch" ? "manual_batch" : "automatic_per_order",
      }}
    />
  );
}