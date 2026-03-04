import { auth } from "@shopvendly/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@shopvendly/db/db";
import { tiktokPosts } from "@shopvendly/db/schema";
import { and, eq, desc } from "@shopvendly/db";
import { z } from "zod";
import { scrapeTikTokPosts, MAX_TIKTOK_IMPORT_POSTS } from "../lib/scraper";
import { resolveTenantAdminAccessByStoreId } from "@/app/admin/lib/admin-access";

const bodySchema = z.object({
  storeId: z.string().uuid(),
  profileUrl: z.string().min(1),
});

type ImportJob = {
  id: string;
  status: "running" | "completed" | "failed";
  profileUrl: string;
  handle?: string;
  targetCount: number;
  importedCount: number;
  storeId?: string;
  error?: string;
  createdAt: number;
  updatedAt: number;
  lastImportedAt?: Date;
};

const importJobs = new Map<string, ImportJob>();

function touchJob(jobId: string, patch: Partial<ImportJob>) {
  const existing = importJobs.get(jobId);
  if (!existing) return;
  importJobs.set(jobId, {
    ...existing,
    ...patch,
    updatedAt: Date.now(),
  });
}

async function runTiktokImportJob(jobId: string, userId: string, storeId: string, profileUrl: string) {
  try {
    const access = await resolveTenantAdminAccessByStoreId(userId, storeId, "write");
    if (!access.store || !access.isAuthorized) {
      throw new Error("Store not found or unauthorized");
    }

    const tenantId = access.store.tenantId;

    const scraped = await scrapeTikTokPosts({
      profileInput: profileUrl,
      tenantId,
      maxPosts: MAX_TIKTOK_IMPORT_POSTS,
    });

    touchJob(jobId, { handle: scraped.handle });

    // Stateless import - don't link to a "Connected Account", just insert posts
    // We append to existing posts. Find the max sortOrder.
    const [maxSortResult] = await db
      .select({ maxOrder: tiktokPosts.sortOrder })
      .from(tiktokPosts)
      .where(and(eq(tiktokPosts.storeId, storeId), eq(tiktokPosts.tenantId, tenantId)))
      .orderBy(desc(tiktokPosts.sortOrder))
      .limit(1);

    const baseSortOrder = (maxSortResult?.maxOrder ?? -1) + 1;

    const postsToInsert = scraped.posts.slice(0, MAX_TIKTOK_IMPORT_POSTS).map((post, index) => ({
      tenantId,
      storeId,
      sourcePostId: post.sourcePostId,
      title: post.title,
      videoDescription: post.videoDescription,
      duration: post.duration,
      coverImageUrl: post.coverImageUrl,
      videoUrl: post.videoUrl, // mp4 video url
      embedLink: post.embedLink,
      shareUrl: post.shareUrl,
      sortOrder: baseSortOrder + index,
      createdAtSource: post.createdAtSource,
    }));

    touchJob(jobId, { targetCount: postsToInsert.length });

    let importedCount = 0;
    for (const post of postsToInsert) {
      const [inserted] = await db
        .insert(tiktokPosts)
        .values(post)
        .onConflictDoNothing()
        .returning({ id: tiktokPosts.id });

      if (inserted) {
        importedCount += 1;
        touchJob(jobId, { importedCount });
      }
    }

    const [latestPost] = await db
      .select({ createdAtSource: tiktokPosts.createdAtSource })
      .from(tiktokPosts)
      .where(and(eq(tiktokPosts.storeId, storeId), eq(tiktokPosts.tenantId, tenantId)))
      .orderBy(desc(tiktokPosts.createdAtSource))
      .limit(1);

    touchJob(jobId, {
      status: "completed",
      importedCount,
      lastImportedAt: latestPost?.createdAtSource ?? new Date(),
    });
  } catch (error) {
    console.error("TikTok background sync error:", error);
    touchJob(jobId, {
      status: "failed",
      error: error instanceof Error ? error.message : "Sync failed",
    });
  }
}

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("jobId")?.trim();
  if (!jobId) {
    return NextResponse.json({ error: "jobId is required" }, { status: 400 });
  }

  const job = importJobs.get(jobId);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json(job);
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { storeId, profileUrl } = bodySchema.parse(body);

    const access = await resolveTenantAdminAccessByStoreId(session.user.id, storeId, "write");
    if (!access.store || !access.isAuthorized) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const jobId = crypto.randomUUID();
    importJobs.set(jobId, {
      id: jobId,
      status: "running",
      profileUrl,
      targetCount: 0,
      importedCount: 0,
      storeId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    void runTiktokImportJob(jobId, session.user.id, storeId, profileUrl);

    return NextResponse.json({
      success: true,
      jobId,
    }, { status: 202 });
  } catch (error) {
    console.error("TikTok sync error:", error);
    const message = error instanceof Error ? error.message : "Sync request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
