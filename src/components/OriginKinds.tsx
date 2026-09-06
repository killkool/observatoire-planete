import Image from "next/image";

const KINDS = [
  {
    src: "/images/origin-observed.png",
    title: "Observation",
    text: "Une station a mesuré. Distance, altitude et numéro de poste restent visibles."
  },
  {
    src: "/images/origin-reanalysis.png",
    title: "Réanalyse",
    text: "ERA5 n’est pas une station. Quand elle est là, elle est comparée, jamais fusionnée."
  },
  {
    src: "/images/origin-forecast.png",
    title: "Prévision",
    text: "Le futur restera une couche à part. Jamais présenté comme un relevé."
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
