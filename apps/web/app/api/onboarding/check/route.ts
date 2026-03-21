import { NextResponse } from "next/server";
import { onboardingRepository } from "@/modules/onboarding/lib/onboarding-repository";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { type, value } = body;

        if (!value) {
            return NextResponse.json({ error: "Value is required" }, { status: 400 });
        }

        let isTaken = false;

        if (type === "phone") {
            isTaken = await onboardingRepository.isPhoneTaken(value);
        } else if (type === "storeName") {
            isTaken = await onboardingRepository.isStoreNameTaken(value);
        } else {
            return NextResponse.json({ error: "Invalid check type" }, { status: 400 });
        }

        return NextResponse.json({ available: !isTaken });
    } catch (error) {
        console.error("Duplicate check error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
