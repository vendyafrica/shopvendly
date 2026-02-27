import { NextResponse } from "next/server";
import { checkSuperAdminApi } from "@/lib/auth-guard";

export async function GET() {
    const auth = await checkSuperAdminApi(["super_admin"]);
    if (auth.error) {
        return NextResponse.json(auth, { status: auth.status });
    }

    try {
        // Payments table is not defined in current schema; return empty placeholder to keep build green.
        return NextResponse.json([]);
    } catch (error) {
        console.error("Payments API Error:", error);
        return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
    }
}
