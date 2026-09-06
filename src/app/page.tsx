import ObservatoryHome from "@/components/ObservatoryHome";
import { getFeaturedPlacesCached } from "@/lib/sqliteReadCache";

export default async function Home() {
  return <ObservatoryHome places={await getFeaturedPlacesCached()} />;
}
