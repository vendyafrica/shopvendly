import { and, eq, isNull } from "@shopvendly/db";
import { db } from "@shopvendly/db/db";
import { stores, superAdmins, tenantMemberships } from "@shopvendly/db/schema";

const TENANT_ADMIN_ROLES = ["owner", "admin"] as const;

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

export async function resolveTenantAdminAccess(userId: string, storeSlug: string): Promise<TenantAdminAccess> {
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

  if (!store) {
    return {
      store: null,
      membership: null,
      isTenantAdmin: false,
      isSuperAdmin: false,
      isAuthorized: false,
    };
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

  return {
    store: {
      ...store,
      defaultCurrency: store.defaultCurrency ?? undefined,
    },
    membership: normalizedMembership,
    isTenantAdmin,
    isSuperAdmin,
    isAuthorized: isTenantAdmin || isSuperAdmin,
  };
}
