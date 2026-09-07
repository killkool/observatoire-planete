import Link from "next/link";
import { formatCelsius, formatMm, roundToPrecision } from "../../packages/weather-core/src/units";

type BirthExampleCard = {
  date: string;
  when: string;
  placeName: string;
  path: string;
  observation: {
    tmin: number | null;
    tmax: number | null;
    precipitationMm: number | null;
    stationName: string;
    distanceKm: number | null;
  } | null;
};

export default function BirthExamples({ cards }: { cards: BirthExampleCard[] }) {
  return (
    <section className="placeCards">
      {cards.map((card) => {
        const km =
          card.observation?.distanceKm != null
            ? roundToPrecision(card.observation.distanceKm, 1)
            : null;
        return (
          <Link key={card.date} href={card.path} className="placeCard">
            <div>
              <span>{card.placeName}</span>
              <h2>{card.when}</h2>
              {card.observation ? (
                <p className="placeCardClimate">
                  <strong>
                    {formatCelsius(card.observation.tmin)} / {formatCelsius(card.observation.tmax)}
                    {" · "}
                    {formatMm(card.observation.precipitationMm)}
                  </strong>
                  {`Station ${card.observation.stationName}${km != null ? ` · ${km} km` : ""}. Mesure officielle, pas une prévision.`}
                </p>
              ) : (
                <p className="placeCardClimate">
                  <strong>Aucune mesure officielle</strong>
                  Aucune valeur n’est inventée.
                </p>
              )}
            </div>
          </Link>
        );
      })}
    </section>
  );
}
