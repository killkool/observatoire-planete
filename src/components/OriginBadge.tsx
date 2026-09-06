import Image from "next/image";

const ICONS = {
  OBSERVED: { src: "/images/origin-observed.png", label: "Mesure officielle" },
  REANALYSIS: { src: "/images/origin-reanalysis.png", label: "Estimation climatique" },
  FORECAST: { src: "/images/origin-forecast.png", label: "Prévision" }
} as const;

export default function OriginBadge({
  kind,
  caption
}: {
  kind: keyof typeof ICONS;
  caption?: string;
}) {
  const icon = ICONS[kind];
  return (
    <div className={`originBadge origin-${kind.toLowerCase()}`}>
      <Image src={icon.src} alt="" width={52} height={52} />
      <div>
        <strong>{icon.label}</strong>
        {caption ? <small>{caption}</small> : null}
      </div>
    </div>
  );
}
