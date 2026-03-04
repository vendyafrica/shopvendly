import { and, eq, isNull } from "@shopvendly/db";
import { db } from "@shopvendly/db/db";
import { stores, superAdmins, tenantMemberships } from "@shopvendly/db/schema";

const TENANT_ADMIN_READ_ROLES = ["owner", "admin", "support", "staff"] as const;
const TENANT_ADMIN_WRITE_ROLES = ["owner", "admin"] as const;
export type TenantAccessMode = "read" | "write";

export type TenantAdminAccess = {
  store: {
    id: string;
    tenantId: string;
    name: string;
    defaultCurrency: string | undefined;
    logoUrl: string | null;
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
  defaultCurrency: string | null;
  logoUrl: string | null;
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

function canAccessTenantRole(role: string, mode: TenantAccessMode): boolean {
  if (mode === "write") {
    return TENANT_ADMIN_WRITE_ROLES.includes(
      role as (typeof TENANT_ADMIN_WRITE_ROLES)[number]
    );
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
    db.query.superAdmins.findFirst({
      where: eq(superAdmins.userId, userId),
      columns: { id: true },
    }),
    db.query.tenantMemberships.findFirst({
      where: and(eq(tenantMemberships.tenantId, store.tenantId), eq(tenantMemberships.userId, userId)),
      columns: { tenantId: true, role: true },
    }),
  ]);

  const normalizedMembership = membership ?? null;
  const normalizedRole = normalizeRole(normalizedMembership?.role);
  const isTenantAdmin = !!normalizedMembership && canAccessTenantRole(normalizedRole, mode);
  const isSuperAdmin = !!superAdmin;
  const isAuthorized = isTenantAdmin || isSuperAdmin;

  return {
    store: {
      ...store,
      defaultCurrency: store.defaultCurrency ?? undefined,
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
  const store = await db.query.stores.findFirst({
    where: and(eq(stores.slug, storeSlug), isNull(stores.deletedAt)),
    columns: {
      id: true,
      tenantId: true,
      name: true,
      defaultCurrency: true,
      logoUrl: true,
    },
  });

  const initialAccess = await resolveAccessForStore(userId, store ?? null, mode);

  if (initialAccess.isAuthorized || !store) {
    return initialAccess;
  }

  const [memberships, matchingStores] = await Promise.all([
    db.query.tenantMemberships.findMany({
      where: eq(tenantMemberships.userId, userId),
      columns: { tenantId: true },
    }),
    db.query.stores.findMany({
      where: and(eq(stores.slug, storeSlug), isNull(stores.deletedAt)),
      columns: {
        id: true,
        tenantId: true,
        name: true,
        defaultCurrency: true,
        logoUrl: true,
      },
    }),
  ]);

  const membershipTenantIds = new Set(memberships.map((membership) => membership.tenantId));
  const storeForUserTenant = matchingStores.find((candidate) => membershipTenantIds.has(candidate.tenantId));

  if (!storeForUserTenant || storeForUserTenant.id === store.id) {
    return initialAccess;
  }

  return resolveAccessForStore(userId, storeForUserTenant, mode);
}

export async function resolveTenantAdminAccessByStoreId(
  userId: string,
  storeId: string,
  mode: TenantAccessMode = "read"
): Promise<TenantAdminAccess> {
  const store = await db.query.stores.findFirst({
    where: and(eq(stores.id, storeId), isNull(stores.deletedAt)),
    columns: {
      id: true,
      tenantId: true,
      name: true,
      defaultCurrency: true,
      logoUrl: true,
    },
  });

  return resolveAccessForStore(userId, store ?? null, mode);
}
