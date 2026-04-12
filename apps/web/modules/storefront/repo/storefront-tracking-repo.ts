import { db } from "@shopvendly/db/db";
import { and, drizzleSql, eq, isNull } from "@shopvendly/db";
import { storefrontEvents, storefrontSessions, stores } from "@shopvendly/db/schema";

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

export const storefrontTrackingRepo = {
  async findStoreIdentityBySlug(slug: string) {
    return db.query.stores.findFirst({
      where: and(eq(stores.slug, slug), isNull(stores.deletedAt)),
      columns: { id: true, tenantId: true },
    });
  },

  async recordSessionAndEvents(store: { id: string; tenantId: string }, body: TrackRequestBody, userAgent?: string) {
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

    const events = body.events
      .filter((event) => typeof event?.eventType === "string" && event.eventType.length > 0)
      .slice(0, 50)
      .map((event) => ({
        tenantId: store.tenantId,
        storeId: store.id,
        eventType: event.eventType,
        userId: body.userId,
        sessionId: body.sessionId,
        orderId: event.orderId,
        productId: event.productId,
        quantity: event.quantity,
        amount: event.amount,
        currency: event.currency,
        referrer: body.referrer,
        utmSource: body.utmSource,
        utmMedium: body.utmMedium,
        utmCampaign: body.utmCampaign,
        userAgent,
        meta: event.meta ?? {},
        createdAt: now,
      }));

    if (events.length > 0) {
      await db.insert(storefrontEvents).values(events);
    }
  },
};
