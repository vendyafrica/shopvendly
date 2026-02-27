import { auth } from "@shopvendly/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@shopvendly/db/db";
import { superAdmins } from "@shopvendly/db/schema";
import { eq } from "@shopvendly/db";

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

    let userRole = await db.query.superAdmins.findFirst({
        where: eq(superAdmins.userId, session.user.id),
    });

    if (!userRole) {
        const existingSuperAdmin = await db.query.superAdmins.findFirst({
            columns: { id: true },
        });

        if (!existingSuperAdmin) {
            await db.insert(superAdmins).values({
                userId: session.user.id,
                role: "super_admin",
            });
            userRole = await db.query.superAdmins.findFirst({
                where: eq(superAdmins.userId, session.user.id),
            });
        }
    }

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

    let userRole = await db.query.superAdmins.findFirst({
        where: eq(superAdmins.userId, session.user.id),
    });

    if (!userRole) {
        const existingSuperAdmin = await db.query.superAdmins.findFirst({
            columns: { id: true },
        });

        if (!existingSuperAdmin) {
            await db.insert(superAdmins).values({
                userId: session.user.id,
                role: "super_admin",
            });
            userRole = await db.query.superAdmins.findFirst({
                where: eq(superAdmins.userId, session.user.id),
            });
        }
    }

    if (!userRole || !allowedRoles.includes(userRole.role)) {
        return { error: "Forbidden", status: 403 };
    }

    return { session, role: userRole };
}
