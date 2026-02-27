import type { MetadataRoute } from "next";

const siteUrl = "https://shopvendly.store";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/search", "/a/", "/c/", "/api/", "/pay/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
