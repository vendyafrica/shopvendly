import { db, superAdmins, tenantMemberships, tenants, eq, and } from "@shopvendly/db";

export const adminRepo = {
    async findSuperAdminByUserId(userId: string) {
        return db.query.superAdmins.findFirst({
            where: eq(superAdmins.userId, userId),
            columns: { id: true },
        });
    },

    async findMembership(userId: string, tenantId?: string, includeTenant: boolean = false) {
        const conditions = [eq(tenantMemberships.userId, userId)];
        if (tenantId) {
            conditions.push(eq(tenantMemberships.tenantId, tenantId));
        }

        return db.query.tenantMemberships.findFirst({
            where: and(...conditions),
            with: includeTenant ? { tenant: true } : undefined,
        });
    },

    async findMembershipsByUserId(userId: string) {
        return db.query.tenantMemberships.findMany({
            where: eq(tenantMemberships.userId, userId),
            columns: { tenantId: true },
        });
    },
};
