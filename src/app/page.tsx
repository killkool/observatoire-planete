import ObservatoryHome from "@/components/ObservatoryHome";
import { getFeaturedClimateCached } from "@/lib/sqliteReadCache";

export default async function Home() {
  return <ObservatoryHome cards={await getFeaturedClimateCached()} />;
}
