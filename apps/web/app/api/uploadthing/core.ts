import { auth } from "@shopvendly/auth";
import { z } from "zod";
import { UploadThingError } from "uploadthing/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getTenantMembership } from "@/app/admin/lib/tenant-membership";
import { superAdminRepo } from "@/repo/super-admin-repo";

const f = createUploadthing();

const IMAGE_MAX_FILE_SIZE = "16MB";
const VIDEO_MAX_FILE_SIZE = "64MB";
const IMAGE_RUNTIME_LIMIT_BYTES = 10 * 1024 * 1024;
const VIDEO_RUNTIME_LIMIT_BYTES = 50 * 1024 * 1024;

const routeInputSchema = z.object({
  tenantId: z.string().uuid(),
});

async function authorizeTenantUpload(req: Request, tenantId: string) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session?.user) {
    throw new UploadThingError("Unauthorized");
  }

  const membership = await getTenantMembership(session.user.id, { tenantId });
  if (!membership) {
    const isSuperAdmin = await superAdminRepo.findByUserId(session.user.id);

    if (isSuperAdmin) {
      return { userId: session.user.id, tenantId };
    }

    throw new UploadThingError("Forbidden");
  }

  return { userId: session.user.id, tenantId };
}

function handleUploadMiddlewareError(endpoint: string, err: unknown): never {
  console.error(`[uploadthing:${endpoint}] middleware error`, err);

  if (err instanceof UploadThingError) {
    throw err;
  }

  throw new UploadThingError("Upload failed. Please re-login and try again.");
}

async function withUploadGuard<T>(endpoint: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    handleUploadMiddlewareError(endpoint, err);
  }
}

function assertTenantFileSizeLimits(files: readonly { size: number; type: string }[]) {
  for (const file of files) {
    if (file.type.startsWith("image/") && file.size > IMAGE_RUNTIME_LIMIT_BYTES) {
      throw new UploadThingError("Image exceeds 10MB limit.");
    }

    if (file.type.startsWith("video/") && file.size > VIDEO_RUNTIME_LIMIT_BYTES) {
      throw new UploadThingError("Video exceeds 50MB limit.");
    }
  }
}

export const ourFileRouter: FileRouter = {
  productMedia: f({
    image: {
      maxFileSize: IMAGE_MAX_FILE_SIZE,
      maxFileCount: 10,
      minFileCount: 1,
    },
    video: {
      maxFileSize: VIDEO_MAX_FILE_SIZE,
      maxFileCount: 4,
      minFileCount: 1,
    },
  })
    .input(routeInputSchema)
    .middleware(async ({ req, input, files }) =>
      withUploadGuard("productMedia", async () => {
        assertTenantFileSizeLimits(files);
        return await authorizeTenantUpload(req, input.tenantId);
      })
    )
    .onUploadComplete(async ({ metadata, file }) => ({
      uploadedBy: String(metadata.userId),
      tenantId: String(metadata.tenantId),
      url: file.ufsUrl,
      key: file.key,
      contentType: file.type,
      name: file.name,
    })),

  storeHeroMedia: f({
    image: {
      maxFileSize: IMAGE_MAX_FILE_SIZE,
      maxFileCount: 6,
      minFileCount: 1,
    },
    video: {
      maxFileSize: VIDEO_MAX_FILE_SIZE,
      maxFileCount: 2,
      minFileCount: 1,
    },
  })
    .input(routeInputSchema)
    .middleware(async ({ req, input, files }) =>
      withUploadGuard("storeHeroMedia", async () => {
        assertTenantFileSizeLimits(files);
        return await authorizeTenantUpload(req, input.tenantId);
      })
    )
    .onUploadComplete(async ({ metadata, file }) => ({
      uploadedBy: String(metadata.userId),
      tenantId: String(metadata.tenantId),
      url: file.ufsUrl,
      key: file.key,
      contentType: file.type,
      name: file.name,
    })),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
