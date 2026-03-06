import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ handle: string; categorySlug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function StorefrontCategoryPage({ params, searchParams }: PageProps) {
  const { handle, categorySlug } = await params;
  const resolvedSearchParams = await searchParams;
  const search = resolvedSearchParams?.q;
  const query = Array.isArray(search) ? search[0] : search;

  const nextParams = new URLSearchParams();
  nextParams.set("collection", categorySlug);
  if (query) nextParams.set("q", query);

  redirect(`/${handle}?${nextParams.toString()}`);
}
