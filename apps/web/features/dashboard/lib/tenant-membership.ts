import { and, eq } from "@shopvendly/db";
import { db } from "@shopvendly/db/db";
import { tenantMemberships, tenants } from "@shopvendly/db/schema";

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

    const conditions = [eq(tenantMemberships.userId, userId)];
    if (tenantId) {
        conditions.push(eq(tenantMemberships.tenantId, tenantId));
    }

    const membership = await db.query.tenantMemberships.findFirst({
        where: and(...conditions),
        with: includeTenant ? { tenant: true } : undefined,
    });

    return membership as BaseMembership | MembershipWithTenant | null;
}
