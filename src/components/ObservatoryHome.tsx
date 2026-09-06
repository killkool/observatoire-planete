import Image from "next/image";
import Link from "next/link";
import OriginKinds from "./OriginKinds";
import { IGN_PHOTO_CREDIT, placePhotoSrc } from "@/lib/placeMedia";

type Place = {
  name: string;
  slug: string;
  insee_code: string;
  latitude: number;
  longitude: number;
};

export default function ObservatoryHome({ places }: { places: Place[] }) {
  return (
    <main className="homeVisual">
      <section className="earthHero">
        <Image
          src="/images/hero-earth.png"
          alt="La Terre vue de l’espace, l’Europe et les Alpes dans la pénombre"
          fill
          priority
          sizes="100vw"
        />
        <div className="earthHeroContent">
          <p className="eyebrow">TERRE • CLIMAT • OCÉANS • HISTOIRE</p>
          <h1>
            Le moteur de recherche de l’histoire
            <span> météo de la planète</span>
          </h1>
          <p>
            Cliquez un lieu, choisissez une date. Vous voyez l’observation, d’où elle vient, et ce qu’elle n’est pas.
          </p>
          <div className="heroCtas">
            <Link className="btnPrimary" href="/weather/france/auvergne-rhone-alpes/isere/grenoble?date=1983-05-12">
              Remonter au 12 mai 1983
            </Link>
            <Link className="btnGhost" href="/weather/france/auvergne-rhone-alpes/isere/grenoble">
              Explorer un lieu
            </Link>
          </div>
        </div>
      </section>

      <section className="placeCards">
        {places.map((place) => (
          <Link key={place.slug} href={`/weather/france/auvergne-rhone-alpes/isere/${place.slug}`} className="placeCard">
            <div className="placeCardPhoto">
              <Image
                src={placePhotoSrc(place.slug)}
                alt={`Vue aérienne IGN de ${place.name}`}
                fill
                sizes="(max-width:1000px) 100vw, 33vw"
              />
            </div>
            <div>
              <span>Isère · INSEE {place.insee_code}</span>
              <h2>{place.name}</h2>
              <small>
                {place.latitude.toFixed(3)}°N {place.longitude.toFixed(3)}°E · {IGN_PHOTO_CREDIT}
              </small>
            </div>
          </Link>
        ))}
      </section>

      <OriginKinds />
    </main>
  );
}
