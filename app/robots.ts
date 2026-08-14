import type { MetadataRoute } from "next";

// Next.js convention: a file named robots.ts in /app is automatically
// served at /robots.txt. Game and forum pages are exactly the kind of
// long-tail content worth indexing (see the README's SEO note); admin
// and account routes are not.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api", "/lists"],
    },
    sitemap: `${getBaseUrl()}/sitemap.xml`,
  };
}

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}
