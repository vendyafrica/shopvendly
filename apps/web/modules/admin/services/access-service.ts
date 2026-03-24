import { adminRepo } from "@/repo/admin-repo";
import { storeRepo } from "@/repo/store-repo";
import { tenantMemberships, tenants } from "@shopvendly/db/schema";

const TENANT_ADMIN_READ_ROLES = ["owner", "admin", "support", "staff"] as const;
const TENANT_ADMIN_WRITE_ROLES = ["owner", "admin"] as const;

type BaseMembership = typeof tenantMemberships.$inferSelect;
type MembershipWithTenant = BaseMembership & { tenant: typeof tenants.$inferSelect | null };

type MembershipOptionsBase = {
  tenantId?: string;
};

type MembershipOptions = MembershipOptionsBase & {
  includeTenant?: false;
};

type MembershipOptionsWithTenant = MembershipOptionsBase & {
  includeTenant: true;
};

export async function getTenantMembership(
  userId: string,
  options?: MembershipOptions
): Promise<BaseMembership | null>;
export async function getTenantMembership(
  userId: string,
  options: MembershipOptionsWithTenant
): Promise<MembershipWithTenant | null>;
export async function getTenantMembership(
  userId: string,
  options: MembershipOptions | MembershipOptionsWithTenant = {}
): Promise<BaseMembership | MembershipWithTenant | null> {
  const { includeTenant = false, tenantId } = options;

  return adminRepo.findMembership(userId, tenantId, includeTenant) as Promise<BaseMembership | MembershipWithTenant | null>;
}

export type TenantAccessMode = "read" | "write";

export type TenantAdminAccess = {
  store: {
    id: string;
    tenantId: string;
    name: string;
    description: string | null;
    defaultCurrency: string | undefined;
    logoUrl: string | null;
    slug: string;
    collectoPassTransactionFeeToCustomer?: boolean;
    collectoPayoutMode?: "automatic_per_order" | "manual_batch";
  } | null;
  membership: {
    tenantId: string;
    role: string;
  } | null;
  isTenantAdmin: boolean;
  isSuperAdmin: boolean;
  isAuthorized: boolean;
};

type StoreAccessContext = {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  defaultCurrency: string | undefined;
  logoUrl: string | null;
  slug: string;
  collectoPassTransactionFeeToCustomer?: boolean;
  collectoPayoutMode?: "automatic_per_order" | "manual_batch";
};

function toUnauthorizedAccess(): TenantAdminAccess {
  return {
    store: null,
    membership: null,
    isTenantAdmin: false,
    isSuperAdmin: false,
    isAuthorized: false,
  };
}

function normalizeRole(role: string | null | undefined): string {
  return (role ?? "").trim().toLowerCase();
}

function normalizeCollectoPayoutMode(value: string | null | undefined): "automatic_per_order" | "manual_batch" {
  return value === "manual_batch" ? "manual_batch" : "automatic_per_order";
}

function canAccessTenantRole(role: string, mode: TenantAccessMode): boolean {
  if (mode === "write") {
    return TENANT_ADMIN_WRITE_ROLES.includes(role as (typeof TENANT_ADMIN_WRITE_ROLES)[number]);
  }

  return TENANT_ADMIN_READ_ROLES.includes(role as (typeof TENANT_ADMIN_READ_ROLES)[number]);
}

async function resolveAccessForStore(
  userId: string,
  store: StoreAccessContext | null,
  mode: TenantAccessMode
): Promise<TenantAdminAccess> {
  if (!store) {
    return toUnauthorizedAccess();
  }

  const [superAdmin, membership] = await Promise.all([
    adminRepo.findSuperAdminByUserId(userId),
    adminRepo.findMembership(userId, store.tenantId),
  ]);

  const normalizedMembership = membership ?? null;
  const normalizedRole = normalizeRole(normalizedMembership?.role);
  const isTenantAdmin = !!normalizedMembership && canAccessTenantRole(normalizedRole, mode);
  const isSuperAdmin = !!superAdmin;
  const isAuthorized = isTenantAdmin || isSuperAdmin;

  return {
    store: {
      ...store,
      defaultCurrency: store.defaultCurrency,
      collectoPassTransactionFeeToCustomer: store.collectoPassTransactionFeeToCustomer ?? false,
      collectoPayoutMode: normalizeCollectoPayoutMode(store.collectoPayoutMode),
    },
    membership: normalizedMembership,
    isTenantAdmin,
    isSuperAdmin,
    isAuthorized,
  };
}

export async function resolveTenantAdminAccess(
  userId: string,
  storeSlug: string,
  mode: TenantAccessMode = "read"
): Promise<TenantAdminAccess> {
  const store = await storeRepo.findAdminBySlug(storeSlug);
  const normalizedStore: StoreAccessContext | null = store
    ? ({
        ...store,
        description: store.description,
        logoUrl: store.logoUrl,
        slug: store.slug,
        collectoPassTransactionFeeToCustomer: store.collectoPassTransactionFeeToCustomer ?? false,
        collectoPayoutMode: normalizeCollectoPayoutMode(store.collectoPayoutMode),
      } as StoreAccessContext)
    : null;

  const initialAccess = await resolveAccessForStore(userId, normalizedStore, mode);

  if (initialAccess.isAuthorized || !store) {
    return initialAccess;
  }

  // Handle demo store bypass
  if (storeSlug === "vendly" && mode === "read") {
    return {
      ...initialAccess,
      isAuthorized: true,
      isTenantAdmin: true,
    };
  }

  const [memberships, matchingStores] = await Promise.all([
    adminRepo.findMembershipsByUserId(userId),
    storeRepo.findAdminManyBySlug(storeSlug),
  ]);

  const membershipTenantIds = new Set(memberships.map((membership) => membership.tenantId));
  const storeForUserTenant = matchingStores.find((candidate) => membershipTenantIds.has(candidate.tenantId));

  if (!storeForUserTenant || storeForUserTenant.id === store.id) {
    return initialAccess;
  }

  const normalizedMatchingStore = storeForUserTenant as StoreAccessContext;
  const normalizedStoreForTenant: StoreAccessContext = {
    ...normalizedMatchingStore,
    defaultCurrency: normalizedMatchingStore.defaultCurrency,
    logoUrl: normalizedMatchingStore.logoUrl,
    slug: normalizedMatchingStore.slug,
    collectoPassTransactionFeeToCustomer: normalizedMatchingStore.collectoPassTransactionFeeToCustomer ?? false,
    collectoPayoutMode: normalizeCollectoPayoutMode(normalizedMatchingStore.collectoPayoutMode),
  };

  return resolveAccessForStore(userId, normalizedStoreForTenant, mode);
}

export async function resolveTenantAdminAccessByStoreId(
  userId: string,
  storeId: string,
  mode: TenantAccessMode = "read"
): Promise<TenantAdminAccess> {
  const store = await storeRepo.findAdminByStoreId(storeId);

  const initialAccess = resolveAccessForStore(userId, store ? ({
    ...store,
    description: store.description,
    defaultCurrency: store.defaultCurrency,
    logoUrl: store.logoUrl,
    slug: store.slug,
    collectoPassTransactionFeeToCustomer: store.collectoPassTransactionFeeToCustomer ?? false,
    collectoPayoutMode: normalizeCollectoPayoutMode(store.collectoPayoutMode),
  } as StoreAccessContext) : null, mode);

  // Handle demo store bypass for vendly
  if (store?.slug === "vendly" && mode === "read") {
    const access = await initialAccess;
    return {
      ...access,
      isAuthorized: true,
      isTenantAdmin: true,
    };
  }

  return initialAccess;
}
