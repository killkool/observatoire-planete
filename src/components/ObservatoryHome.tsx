import Image from "next/image";
import Link from "next/link";
import OriginKinds from "./OriginKinds";
import PlaceSearch from "./PlaceSearch";
import { IGN_PHOTO_CREDIT, HERO_IMAGE_SIZES, placePhotoSrc } from "@/lib/placeMedia";
import { departmentLabel } from "@/lib/placeUrl";
import { formatCelsius, formatDaysGe30, formatMm, roundToPrecision } from "../../packages/weather-core/src/units";

type HomeClimateCard = {
  place: {
    name: string;
    slug: string;
    insee_code: string;
    department_slug: string;
  };
  path: string;
  station: { id: string; name: string; distanceKm: number | null } | null;
  lastComplete: {
    year: number;
    tminMean: number | null;
    tmaxMean: number | null;
    precipitationSum: number | null;
    precipComplete: boolean;
    daysGe30: number;
  } | null;
};

export default function ObservatoryHome({ cards }: { cards: HomeClimateCard[] }) {
  return (
    <main className="homeVisual">
      <section className="earthHero">
        <Image
          src="/images/hero-earth.jpg"
          alt="La France et les Alpes vues du ciel, illustration d’ambiance"
          fill
          priority
          quality={70}
          decoding="sync"
          sizes={HERO_IMAGE_SIZES}
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
        {cards.map((card) => {
          const place = card.place;
          const rain =
            card.lastComplete?.precipComplete && card.lastComplete.precipitationSum != null
              ? ` · ${formatMm(card.lastComplete.precipitationSum)}`
              : "";
          const hotDays =
            card.lastComplete != null ? ` · ${formatDaysGe30(card.lastComplete.daysGe30)}` : "";
          const stationKm =
            card.station?.distanceKm != null ? ` · ${roundToPrecision(card.station.distanceKm, 1)} km` : "";
          return (
            <Link key={place.slug} href={card.path} className="placeCard">
              <div className="placeCardPhoto">
                <Image
                  src={placePhotoSrc(place.slug)}
                  alt={`Vue aérienne IGN de ${place.name}`}
                  fill
                  sizes="(max-width:1000px) 100vw, 33vw"
                  quality={70}
                />
              </div>
              <div>
                <span>
                  {departmentLabel(place.department_slug)} · {place.name}
                </span>
                <h2>{place.name}</h2>
                {card.lastComplete ? (
                  <p className="placeCardClimate">
                    <strong>
                      {card.lastComplete.year}
                      {card.lastComplete.tminMean != null
                        ? ` · min. ${formatCelsius(card.lastComplete.tminMean)}`
                        : ""}{" "}
                      · max.                       {formatCelsius(card.lastComplete.tmaxMean)}
                      {rain}
                      {hotDays}
                    </strong>
                    {card.station
                      ? `Station ${card.station.name}${stationKm}. Année climatique complète, pas une prévision.`
                      : "Année climatique complète, pas une prévision."}
                  </p>
                ) : card.station ? (
                  <p className="placeCardClimate">
                    Station {card.station.name}
                    {stationKm}.
                  </p>
                ) : null}
                <small>{IGN_PHOTO_CREDIT}</small>
              </div>
            </Link>
          );
        })}
      </section>

      <OriginKinds />
    </main>
  );
}
