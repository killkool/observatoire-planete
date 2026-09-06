import { unstable_cache } from "next/cache";
import { listFeaturedPlaces } from "@/lib/placeHistory";
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
