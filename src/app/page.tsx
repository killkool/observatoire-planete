import ObservatoryHome from "@/components/ObservatoryHome";
import { listFeaturedPlaces } from "@/lib/placeHistory";

export default function Home() {
  return <ObservatoryHome places={listFeaturedPlaces()} />;
}
