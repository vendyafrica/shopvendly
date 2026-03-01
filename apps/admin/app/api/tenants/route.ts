import { db } from "@shopvendly/db/db";
import { tenants, tenantMemberships, stores, users, verification } from "@shopvendly/db/schema";
import { desc, eq } from "@shopvendly/db";
import { NextResponse } from "next/server";
import { checkSuperAdminApi } from "@/lib/auth-guard";
import crypto from "crypto";
import { sendWelcomeEmail } from "@shopvendly/transactional";

const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

function generateSlugFromName(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 50);
}

export async function POST(req: Request) {
    const auth = await checkSuperAdminApi(["super_admin"]);
    if (auth.error) {
        return NextResponse.json(auth, { status: auth.status });
    }

    try {
        const body = await req.json();
        const fullName = (body?.fullName as string | undefined)?.trim();
        const email = (body?.email as string | undefined)?.trim().toLowerCase();
        const phoneNumber = (body?.phoneNumber as string | undefined)?.trim();
        const storeName = (body?.storeName as string | undefined)?.trim();
        const storeDescription = (body?.storeDescription as string | undefined)?.trim();
        const storeLocation = (body?.storeLocation as string | undefined)?.trim();
        const categories = Array.isArray(body?.categories) ? (body.categories as string[]) : [];

        if (!fullName || !email || !storeName) {
            return NextResponse.json(
                { error: "Full name, email, and store name are required" },
                { status: 400 }
            );
        }

        if (categories.length === 0) {
            return NextResponse.json(
                { error: "Select at least one category" },
                { status: 400 }
            );
        }

        const existingTenant = await db.query.tenants.findFirst({
            where: eq(tenants.billingEmail, email),
            columns: { id: true },
        });

        if (existingTenant) {
            return NextResponse.json(
                { error: "A tenant with this email already exists" },
                { status: 409 }
            );
        }

        let user = await db.query.users.findFirst({
            where: eq(users.email, email),
        });

        if (!user) {
            const [created] = await db
                .insert(users)
                .values({
                    id: crypto.randomUUID(),
                    name: fullName,
                    email,
                    emailVerified: false,
                })
                .returning();
            user = created;
        }

        if (!user) {
            return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
        }

        const tenantSlug = generateTenantSlug(email);
        const storeSlug = await ensureUniqueStoreSlug(storeName);

        const [tenant] = await db
            .insert(tenants)
            .values({
                fullName,
                slug: tenantSlug,
                phoneNumber: phoneNumber || null,
                status: "active",
                plan: "free",
                billingEmail: email,
                onboardingStep: "complete",
                onboardingData: {
                    personal: {
                        fullName,
                        phoneNumber: phoneNumber || "",
                    },
                    store: {
                        storeName,
                        storeDescription: storeDescription || "",
                        storeLocation: storeLocation || "",
                    },
                    business: {
                        categories,
                    },
                },
            })
            .returning();

        if (!tenant) {
            return NextResponse.json({ error: "Failed to create tenant" }, { status: 500 });
        }

        await db.insert(tenantMemberships).values({
            tenantId: tenant.id,
            userId: user.id,
            role: "owner",
        });

        const [store] = await db
            .insert(stores)
            .values({
                tenantId: tenant.id,
                name: storeName,
                slug: storeSlug,
                description: storeDescription || null,
                categories,
                storeContactEmail: email,
                storeContactPhone: phoneNumber || null,
                storeAddress: storeLocation || null,
                status: true,
            })
            .returning();

        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + VERIFICATION_TTL_MS);

        await db.delete(verification).where(eq(verification.identifier, email));
        await db.insert(verification).values({
            id: crypto.randomUUID(),
            identifier: email,
            value: token,
            expiresAt,
        });

        const configuredWebUrl =
            process.env.WEB_URL ||
            process.env.NEXT_PUBLIC_WEB_URL ||
            process.env.NEXT_PUBLIC_APP_URL;
        const fallbackProdUrl = "https://shopvendly.store";

        const webBaseUrl = (configuredWebUrl || fallbackProdUrl).replace(/\/$/, "");
        const normalizedWebBaseUrl = webBaseUrl.includes("localhost")
            ? webBaseUrl
            : webBaseUrl.startsWith("http")
            ? webBaseUrl
            : `https://${webBaseUrl}`;
        const verifyBase = `${normalizedWebBaseUrl}/api/auth/verify-seller?token=${token}&email=${encodeURIComponent(email)}`;

        const adminUrl = `${verifyBase}&redirect=${encodeURIComponent(`/a/${storeSlug}`)}`;
        const connectInstagramUrl = `${verifyBase}&redirect=${encodeURIComponent(`/a/${storeSlug}/integrations`)}`;
        const storefrontUrl = `${normalizedWebBaseUrl}/${storeSlug}`;

        await sendWelcomeEmail({
            to: email,
            name: fullName,
            storefrontUrl,
            adminUrl,
            connectInstagramUrl,
        });

        return NextResponse.json({
            success: true,
            tenant,
            store,
        });
    } catch (error) {
        console.error("Create tenant error:", error);
        return NextResponse.json({ error: "Failed to create tenant" }, { status: 500 });
    }
}

function generateTenantSlug(input: string): string {
    const base = input
        .toLowerCase()
        .replace(/@.*$/, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 30);

    const suffix = Math.random().toString(36).slice(2, 6);
    return `${base}-${suffix}`;
}

async function ensureUniqueStoreSlug(name: string): Promise<string> {
    let slug = generateSlugFromName(name);
    let exists = await db.query.stores.findFirst({
        where: eq(stores.slug, slug),
        columns: { id: true },
    });
    let count = 1;
    const originalSlug = slug;

    while (exists) {
        slug = `${originalSlug}-${count}`;
        exists = await db.query.stores.findFirst({
            where: eq(stores.slug, slug),
            columns: { id: true },
        });
        count++;
    }

    return slug;
}

export async function GET() {
    const auth = await checkSuperAdminApi(["super_admin"]);
    if (auth.error) {
        return NextResponse.json(auth, { status: auth.status });
    }

    try {
        const data = await db.query.tenants.findMany({
            orderBy: [desc(tenants.createdAt)],
        });
        return NextResponse.json(data);
    } catch (error) {
        console.error("Tenants API Error:", error);
        return NextResponse.json({ error: "Failed to fetch tenants" }, { status: 500 });
    }
}
