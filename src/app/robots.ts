import type { MetadataRoute } from "next";
import { publicSiteOrigin } from "@/lib/seoContent";

export default function robots(): MetadataRoute.Robots {
  const origin = publicSiteOrigin();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/api/"]
    },
    sitemap: `${origin}/sitemap.xml`
  };
}
