import { auth } from "@shopvendly/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db, eq, superAdmins } from "@shopvendly/db";

export async function getSession() {
    return await auth.api.getSession({
        headers: await headers(),
    });
}

/**
 * Enforces platform role check for Server Components / Actions.
 * Redirects if unauthorized.
 */
export async function requireSuperAdmin(allowedRoles: string[]) {
    const session = await getSession();
    if (!session) {
        redirect("/login");
    }

    const userRole = await db.query.superAdmins.findFirst({
        where: eq(superAdmins.userId, session.user.id),
    });

    if (!userRole || !allowedRoles.includes(userRole.role)) {
        redirect("/unauthorized");
    }

    return { session, role: userRole };
}

/**
 * Checks platform role for API Routes.
 * Returns null or error response if unauthorized.
 */
export async function checkSuperAdminApi(allowedRoles: string[]) {
    const session = await getSession();
    if (!session) {
        return { error: "Unauthorized", status: 401 };
    }

    const userRole = await db.query.superAdmins.findFirst({
        where: eq(superAdmins.userId, session.user.id),
    });

    if (!userRole || !allowedRoles.includes(userRole.role)) {
        return { error: "Forbidden", status: 403 };
    }

    return { session, role: userRole };
}
