import { and, eq, isNull } from "@shopvendly/db";
import { db } from "@shopvendly/db/db";
import { stores, superAdmins, tenantMemberships } from "@shopvendly/db/schema";

const TENANT_ADMIN_ROLES = ["owner", "admin"] as const;
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
  const isTenantAdmin =
    !!normalizedMembership &&
    TENANT_ADMIN_ROLES.includes(normalizedMembership.role as (typeof TENANT_ADMIN_ROLES)[number]);
  const isSuperAdmin = !!superAdmin;
  const isAuthorized = mode === "write" ? isTenantAdmin : isTenantAdmin || isSuperAdmin;

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

  return resolveAccessForStore(userId, store ?? null, mode);
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
