import type { MetadataRoute } from "next";
import { SEO_ORIGIN } from "@/lib/seo";

export default function robots():MetadataRoute.Robots {
  return {
    // Private HTML stays crawlable so its noindex directives can be read.
    rules:{userAgent:"*",allow:"/",disallow:["/api/","/*?*token=","/*?*code="]},
    sitemap:`${SEO_ORIGIN}/sitemap.xml`,
    host:SEO_ORIGIN,
  };
}
