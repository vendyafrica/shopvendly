import { Request, Response, NextFunction } from "express";
import { auth } from "@vendly/auth";
import { db, tenantMemberships, superAdmins, and, eq } from "@vendly/db";
import { AuthenticatedRequest, TenantRole, PlatformRole } from "../types/auth";

/**
 * Requires a valid authenticated session and attaches base auth context to the request.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session?.user) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Authentication required",
      });
    }

    (req as AuthenticatedRequest).auth = {
      userId: session.user.id,
      email: session.user.email,
    };

    return next();
  } catch (err) {
    console.error("[Auth] Session error:", err);
    return res.status(401).json({
      error: "Unauthorized",
      message: "Invalid or expired session",
    });
  }
}

/**
 * Optionally attaches auth context for mixed public/private routes.
 */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (session?.user) {
      (req as AuthenticatedRequest).auth = {
        userId: session.user.id,
        email: session.user.email,
      };
    }

    return next();
  } catch {
    return next();
  }
}

/**
 * Requires the authenticated user to hold one of the allowed tenant roles for :tenantId.
 */
export function requireTenantRole(allowedRoles: TenantRole[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const requestAuth = (req as AuthenticatedRequest).auth;
    const tenantId = req.params.tenantId as string;

    if (!requestAuth || !tenantId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const membership = await db.query.tenantMemberships.findFirst({
      where: and(eq(tenantMemberships.userId, requestAuth.userId), eq(tenantMemberships.tenantId, tenantId)),
    });

    if (!membership || !allowedRoles.includes(membership.role as TenantRole)) {
      return res.status(403).json({
        error: "Forbidden",
        message: "Insufficient tenant permissions",
      });
    }

    requestAuth.tenant = {
      tenantId,
      role: membership.role as TenantRole,
    };

    return next();
  };
}

/**
 * Requires the authenticated user to hold one of the allowed platform-level roles.
 */
export function requirePlatformRole(allowedRoles: PlatformRole[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const requestAuth = (req as AuthenticatedRequest).auth;

    if (!requestAuth) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const platformMembership = await db.query.superAdmins.findFirst({
      where: eq(superAdmins.userId, requestAuth.userId),
    });

    if (!platformMembership || !allowedRoles.includes(platformMembership.role as PlatformRole)) {
      return res.status(403).json({
        error: "Forbidden",
        message: "Platform access denied",
      });
    }

    requestAuth.platformRole = platformMembership.role as PlatformRole;
    return next();
  };
}
