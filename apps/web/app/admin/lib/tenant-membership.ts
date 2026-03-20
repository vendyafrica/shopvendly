import { adminRepo } from "@/repo/admin-repo";
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

    return adminRepo.findMembership(userId, tenantId, includeTenant) as Promise<BaseMembership | MembershipWithTenant | null>;
}
