import type { MetadataRoute } from "next";
import { communePath } from "@/lib/placeUrl";
import { listIndexablePlaces, publicSiteOrigin } from "@/lib/seoContent";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = publicSiteOrigin();
  const staticRoutes = ["/", "/comparer", "/naissance", "/sources", "/methodology"];
  const communeEntries = listIndexablePlaces().map((place) => ({
    url: `${origin}${communePath(place)}`,
    changeFrequency: "weekly" as const
  }));

  return [
    ...staticRoutes.map((path) => ({
      url: `${origin}${path}`,
      changeFrequency: "weekly" as const
    })),
    ...communeEntries
  ];
}
