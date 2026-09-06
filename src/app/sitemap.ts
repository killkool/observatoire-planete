import type { MetadataRoute } from "next";
import { communePath } from "@/lib/placeUrl";
import { publicSiteOrigin } from "@/lib/seoContent";
import { getIndexablePlacesCached } from "@/lib/sqliteReadCache";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = publicSiteOrigin();
  const staticRoutes = ["/", "/comparer", "/naissance", "/sources", "/methodology"];
  const communeEntries = (await getIndexablePlacesCached()).map((place) => ({
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
