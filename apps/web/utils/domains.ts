'use server';

import { db, tenants, eq } from '@shopvendly/db';
import { redirect } from 'next/navigation';

const RESERVED = [
  'www',
  'admin',
  'ai',
  'api',
  'support',
  'docs',
];

function sanitizeSubdomain(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '');
}

export async function createTenant(
  _prevState: unknown,
  formData: FormData
) {
  const name = formData.get('name') as string;
  const subdomainRaw = formData.get('subdomain') as string;
  const category = formData.get('category') as string;

  if (!name || !subdomainRaw || !category) {
    return { error: 'All fields are required' };
  }

  const subdomain = sanitizeSubdomain(subdomainRaw);
  if (!subdomain) return { error: 'Invalid subdomain format' };

  if (RESERVED.includes(subdomain)) {
    return { error: 'Subdomain is reserved' };
  }

  const existing = await db
    .select()
    .from(tenants)
    .where(eq(tenants.slug, subdomain))
    .limit(1);

  if (existing.length) {
    return { error: 'Subdomain already taken' };
  }

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
  const res = await fetch(`${apiBaseUrl}/api/site-builder/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tenantSlug: subdomain,
      input: {
        storeName: name,
        category,
      },
    }),
    cache: 'no-store',
  });

  if (!res.ok) {
    const message = await res.text();
    return { error: message || 'Failed to start storefront generation' };
  }

  const data = (await res.json()) as { jobId?: string };
  if (!data.jobId) {
    return { error: 'Missing jobId from API' };
  }

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'vendlyafrica.store';
  redirect(`/admin/${subdomain}/studio?jobId=${data.jobId}`);
}
