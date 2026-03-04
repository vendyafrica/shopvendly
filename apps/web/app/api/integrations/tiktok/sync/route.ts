import { auth } from "@shopvendly/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@shopvendly/db/db";
import { tiktokAccounts, tiktokPosts } from "@shopvendly/db/schema";
import { and, eq, desc } from "@shopvendly/db";
import { z } from "zod";
import { scrapeTikTokPosts, MAX_TIKTOK_IMPORT_POSTS } from "../lib/scraper";
import { resolveTenantAdminAccessByStoreId } from "@/app/admin/lib/admin-access";

const bodySchema = z.object({
  storeId: z.string().uuid(),
  profileUrl: z.string().min(1),
});

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

    const tenantId = access.store.tenantId;

    const scraped = await scrapeTikTokPosts({
      profileInput: profileUrl,
      tenantId,
      maxPosts: MAX_TIKTOK_IMPORT_POSTS,
    });

    const existingAccount = await db.query.tiktokAccounts.findFirst({
      where: and(eq(tiktokAccounts.storeId, storeId), eq(tiktokAccounts.tenantId, tenantId)),
      columns: { id: true },
    });

    const accountValues = {
      tenantId,
      storeId,
      userId: session.user.id,
      providerAccountId: scraped.handle,
      displayName: `@${scraped.handle}`,
      username: scraped.handle,
      avatarUrl: null,
      profileUrl: scraped.profileUrl,
      isActive: true,
      lastSyncedAt: new Date(),
      lastImportedAt: new Date(),
    };

    let accountId: string;
    if (existingAccount) {
      const [updated] = await db
        .update(tiktokAccounts)
        .set(accountValues)
        .where(eq(tiktokAccounts.id, existingAccount.id))
        .returning({ id: tiktokAccounts.id });

      if (!updated) {
        throw new Error("Failed to update TikTok account");
      }

      accountId = updated.id;
    } else {
      const [created] = await db.insert(tiktokAccounts).values(accountValues).returning({ id: tiktokAccounts.id });

      if (!created) {
        throw new Error("Failed to create TikTok account");
      }

      accountId = created.id;
    }

    await db.delete(tiktokPosts).where(and(eq(tiktokPosts.storeId, storeId), eq(tiktokPosts.tenantId, tenantId)));

    const postsToInsert = scraped.posts.slice(0, MAX_TIKTOK_IMPORT_POSTS).map((post, index) => ({
      tenantId,
      storeId,
      accountId,
      sourcePostId: post.sourcePostId,
      title: post.title,
      videoDescription: post.videoDescription,
      duration: post.duration,
      coverImageUrl: post.coverImageUrl,
      embedLink: post.embedLink,
      shareUrl: post.shareUrl,
      sortOrder: index,
      createdAtSource: post.createdAtSource,
    }));

    let importedCount = 0;
    for (const post of postsToInsert) {
      const [inserted] = await db
        .insert(tiktokPosts)
        .values(post)
        .onConflictDoNothing()
        .returning({ id: tiktokPosts.id });

      if (inserted) {
        importedCount += 1;
      }
    }

    const [latestPost] = await db
      .select({ createdAtSource: tiktokPosts.createdAtSource })
      .from(tiktokPosts)
      .where(and(eq(tiktokPosts.storeId, storeId), eq(tiktokPosts.tenantId, tenantId)))
      .orderBy(desc(tiktokPosts.createdAtSource))
      .limit(1);

    return NextResponse.json({
      ok: true,
      storeId,
      profileUrl: scraped.profileUrl,
      handle: scraped.handle,
      importedCount,
      targetCount: postsToInsert.length,
      lastImportedAt: latestPost?.createdAtSource ?? new Date(),
    });
  } catch (error) {
    console.error("TikTok sync error:", error);
    const message = error instanceof Error ? error.message : "Sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
