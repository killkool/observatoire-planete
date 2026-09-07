import Link from "next/link";

type CompareExampleCard = {
  path: string;
  communeA: string;
  communeB: string;
  sameStation: boolean;
  summary: string;
  description: string;
};

export default function CompareExamples({ cards }: { cards: CompareExampleCard[] }) {
  return (
    <section className="compareExamples">
      {cards.map((card) => (
        <Link key={card.path} href={card.path} className="placeCard">
          <div>
            <span>
              {card.communeA} · {card.communeB}
            </span>
            <h2>{card.summary}</h2>
            <p className="placeCardClimate">{card.description}</p>
          </div>
        </Link>
      ))}
    </section>
  );
}
