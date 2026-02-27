import { Request } from "express";

export type TenantRole = "owner" | "admin" | "support" | "staff";
export type PlatformRole = "super_admin" | "platform_support";

export interface AuthContext {
  userId: string;
  email?: string;
  platformRole?: PlatformRole;
  tenant?: {
    tenantId: string;
    role: TenantRole;
  };
}

export interface AuthenticatedRequest extends Request {
  auth?: AuthContext;
}
