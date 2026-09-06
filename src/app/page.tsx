import ObservatoryHome from "@/components/ObservatoryHome";
import { listPlaces } from "@/lib/placeHistory";

export default function Home() {
  return <ObservatoryHome places={listPlaces()} />;
}
