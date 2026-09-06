import type { MetadataRoute } from "next";
import { listPlaces } from "@/lib/placeHistory";
import { communePath } from "@/lib/placeUrl";
import { publicSiteOrigin, seoContentScore } from "@/lib/seoContent";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = publicSiteOrigin();
  const staticRoutes = ["/", "/comparer", "/naissance", "/sources", "/methodology"];
  const places = listPlaces();
  const communeEntries = places
    .filter((place) =>
      seoContentScore({
        hasPlace: Boolean(place.insee_code && place.name && place.latitude != null && place.longitude != null),
        completeClimateYears: 0,
        hasDistinctiveHistory: true
      }).indexable
    )
    .map((place) => ({
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
