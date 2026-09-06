import { unstable_cache } from "next/cache";
import { getCommuneYearly } from "@/lib/communeYearly";
import { getPlaceHistory, listFeaturedPlaces } from "@/lib/placeHistory";
import { listIndexablePlaces } from "@/lib/seoContent";

/** Lecture SQLite mise en cache 1 h. Pas un CDN, pas un appel fournisseur. */
export const getFeaturedPlacesCached = unstable_cache(
  async () => listFeaturedPlaces(),
  ["featured-places-v1"],
  { revalidate: 3600 }
);

export const getIndexablePlacesCached = unstable_cache(
  async () => listIndexablePlaces(),
  ["indexable-places-v1"],
  { revalidate: 3600 }
);

export const getPlaceHistoryCached = unstable_cache(
  async (slug: string, date: string) => getPlaceHistory(slug, date),
  ["place-history-v1"],
  { revalidate: 3600 }
);

export const getCommuneYearlyCached = unstable_cache(
  async (insee: string) => getCommuneYearly(insee),
  ["commune-yearly-v1"],
  { revalidate: 3600 }
);
