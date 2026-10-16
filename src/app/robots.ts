import type { MetadataRoute } from "next";
import { SEO_ORIGIN } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/*?*token=", "/*?*code="] },
    sitemap: `${SEO_ORIGIN}/sitemap.xml`,
    host: SEO_ORIGIN,
  };
}
