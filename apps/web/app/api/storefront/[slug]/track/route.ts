import { NextRequest, NextResponse } from "next/server";
import { db } from "@shopvendly/db/db";
import { storefrontEvents, storefrontSessions, stores } from "@shopvendly/db/schema";
import { and, drizzleSql, eq, isNull } from "@shopvendly/db";

type RouteParams = {
  params: Promise<{ slug: string }>;
};

type TrackEventInput = {
  eventType: string;
  productId?: string;
  orderId?: string;
  quantity?: number;
  amount?: number;
  currency?: string;
  meta?: Record<string, unknown>;
};

type TrackRequestBody = {
  sessionId: string;
  userId?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  deviceType?: string;
  country?: string;
  events: TrackEventInput[];
};

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;

    const store = await db.query.stores.findFirst({
      where: and(eq(stores.slug, slug), isNull(stores.deletedAt)),
      columns: { id: true, tenantId: true },
    });

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const body = (await request.json().catch(() => null)) as TrackRequestBody | null;

    if (!body?.sessionId || !Array.isArray(body.events) || body.events.length === 0) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const now = new Date();

    await db
      .insert(storefrontSessions)
      .values({
        tenantId: store.tenantId,
        storeId: store.id,
        sessionId: body.sessionId,
        userId: body.userId,
        firstSeenAt: now,
        lastSeenAt: now,
        visitCount: 1,
        isReturning: false,
        referrer: body.referrer,
        utmSource: body.utmSource,
        utmMedium: body.utmMedium,
        utmCampaign: body.utmCampaign,
        deviceType: body.deviceType,
        country: body.country,
      })
      .onConflictDoUpdate({
        target: [storefrontSessions.storeId, storefrontSessions.sessionId],
        set: {
          lastSeenAt: now,
          updatedAt: now,
          isReturning: true,
          userId: body.userId ?? undefined,
          referrer: body.referrer ?? undefined,
          utmSource: body.utmSource ?? undefined,
          utmMedium: body.utmMedium ?? undefined,
          utmCampaign: body.utmCampaign ?? undefined,
          deviceType: body.deviceType ?? undefined,
          country: body.country ?? undefined,
          visitCount: drizzleSql`${storefrontSessions.visitCount} + 1`,
        },
      });

    const userAgent = request.headers.get("user-agent") || undefined;

    const events = body.events
      .filter((e) => typeof e?.eventType === "string" && e.eventType.length > 0)
      .slice(0, 50)
      .map((e) => ({
        tenantId: store.tenantId,
        storeId: store.id,
        eventType: e.eventType,
        userId: body.userId,
        sessionId: body.sessionId,
        orderId: e.orderId,
        productId: e.productId,
        quantity: e.quantity,
        amount: e.amount,
        currency: e.currency,
        referrer: body.referrer,
        utmSource: body.utmSource,
        utmMedium: body.utmMedium,
        utmCampaign: body.utmCampaign,
        userAgent,
        meta: e.meta ?? {},
        createdAt: now,
      }));

    if (events.length > 0) {
      await db.insert(storefrontEvents).values(events);
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("Error tracking storefront event:", error);
    return NextResponse.json({ error: "Failed to track" }, { status: 500 });
  }
}
