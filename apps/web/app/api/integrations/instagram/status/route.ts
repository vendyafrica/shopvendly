import { auth } from "@shopvendly/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@shopvendly/db/db";
import { account, products } from "@shopvendly/db/schema";
import { eq, and } from "@shopvendly/db";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ connected: false, imported: false }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("storeId");

    // Check better-auth account link
    const instagramAuthAccount = await db.query.account.findFirst({
      where: and(
        eq(account.userId, session.user.id),
        eq(account.providerId, "instagram"),
      ),
    });

    const isConnected = !!instagramAuthAccount?.accessToken;
    let isImported = false;

    if (isConnected && storeId) {
      // Verify store access (optional but good practice)
      // For now, just check if products exist for this store and source=instagram
      const existingProduct = await db.query.products.findFirst({
        where: and(
          eq(products.storeId, storeId),
          eq(products.source, "instagram")
        ),
        columns: { id: true }
      });

      if (existingProduct) {
        isImported = true;
      }
    }

    return NextResponse.json({ connected: isConnected, imported: isImported });
  } catch (error) {
    console.error("Instagram status check error:", error);
    return NextResponse.json({ connected: false, imported: false }, { status: 500 });
  }
}
