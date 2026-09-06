import Image from "next/image";

const KINDS = [
  {
    src: "/images/origin-observed.png",
    title: "Mesure officielle",
    text: "Un poste Météo-France a relevé la température et la pluie. La station n’est pas forcément dans la commune : la distance reste indiquée."
  },
  {
    src: "/images/origin-reanalysis.png",
    title: "Estimation climatique",
    text: "Quand aucune station pertinente n’existe, une réanalyse peut compléter. Ce n’est pas un thermomètre."
  }
] as const;

export default function OriginKinds() {
  return (
    <section className="originStory">
      {KINDS.map((kind) => (
        <article key={kind.title}>
          <div className="originStoryPhoto">
            <Image src={kind.src} alt="" fill sizes="(max-width:1000px) 100vw, 33vw" />
          </div>
          <h3>{kind.title}</h3>
          <p>{kind.text}</p>
        </article>
      ))}
    </section>
  );
}
