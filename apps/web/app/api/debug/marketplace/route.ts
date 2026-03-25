import { marketplaceService } from "@/modules/marketplace/lib/marketplace-service";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const data = await marketplaceService.getHomePageData();
        return NextResponse.json({
            success: true,
            storeCount: data.stores.length,
            stores: data.stores.map(s => ({
                id: s.id,
                name: s.name,
                heroMedia: s.heroMedia,
                images: s.images,
                logoUrl: s.logoUrl
            }))
        });
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
