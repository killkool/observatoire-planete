import Image from "next/image";
import Link from "next/link";
import OriginKinds from "./OriginKinds";
import PlaceSearch from "./PlaceSearch";
import { IGN_PHOTO_CREDIT, placePhotoSrc } from "@/lib/placeMedia";
import { communePath, departmentLabel } from "@/lib/placeUrl";

type Place = {
  name: string;
  slug: string;
  insee_code: string;
  latitude: number;
  longitude: number;
  region_slug: string;
  department_slug: string;
};

export default function ObservatoryHome({ places }: { places: Place[] }) {
  return (
    <main className="homeVisual">
      <section className="earthHero">
        <Image
          src="/images/hero-earth.png"
          alt="La France et les Alpes vues du ciel, illustration d’ambiance"
          fill
          priority
          sizes="100vw"
        />
        <div className="earthHeroContent">
          <p className="eyebrow">LA MÉMOIRE MÉTÉO DE LA FRANCE</p>
          <h1>
            L’histoire météo
            <span> de votre ville</span>
          </h1>
          <p>Tapez une commune, un code postal ou un code INSEE. Pas besoin de connaître une station météo.</p>
          <PlaceSearch autoFocus />
          <div className="heroCtas">
            <Link className="btnGhost" href="/naissance">
              Quel temps faisait-il le jour de votre naissance ?
            </Link>
            <Link className="btnGhost" href="/comparer">
              Comparer deux communes
            </Link>
          </div>
        </div>
      </section>

      <section className="placeCards">
        {places.map((place) => (
          <Link key={place.slug} href={communePath(place)} className="placeCard">
            <div className="placeCardPhoto">
              <Image
                src={placePhotoSrc(place.slug)}
                alt={`Vue aérienne IGN de ${place.name}`}
                fill
                sizes="(max-width:1000px) 100vw, 33vw"
              />
            </div>
            <div>
              <span>
                {departmentLabel(place.department_slug)} · {place.name}
              </span>
              <h2>{place.name}</h2>
              <small>{IGN_PHOTO_CREDIT}</small>
            </div>
          </Link>
        ))}
      </section>

      <OriginKinds />
    </main>
  );
}
