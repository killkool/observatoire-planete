import Link from "next/link";

type YearPoint = { date: string; tmin: number | null; tmax: number | null };

function colorFor(tmax: number | null) {
  if (tmax == null) return "#1a2a30";
  if (tmax < 0) return "#4d7cff";
  if (tmax < 10) return "#6aa9c9";
  if (tmax < 20) return "#c9b56a";
  if (tmax < 28) return "#e0893a";
  if (tmax < 35) return "#e24a2b";
  return "#9b1d3c";
}

export default function YearHeatmap({
  series,
  selected,
  hrefFor
}: {
  series: YearPoint[];
  selected?: string;
  hrefFor: (date: string) => string;
}) {
  if (!series.length) return null;
  return (
    <div className="yearHeat">
      <div className="yearHeatGrid">
        {series.map((row) => (
          <Link
            key={row.date}
            href={hrefFor(row.date)}
            prefetch={false}
            className={`yearCell${row.date === selected ? " on" : ""}`}
            style={{ background: colorFor(row.tmax) }}
            title={`${row.date} · Tmin ${row.tmin ?? "—"} · Tmax ${row.tmax ?? "—"}`}
            aria-label={`${row.date} : minimale ${row.tmin ?? "non disponible"}, maximale ${row.tmax ?? "non disponible"}`}
            aria-current={row.date === selected ? "date" : undefined}
          >
            <em>{row.date.slice(0, 4)}</em>
          </Link>
        ))}
      </div>
      <p className="yearHeatLegend">
        Chaque case est une année réelle observée — couleur selon Tmax. Ouvrir une année affiche ce jour-là.
      </p>
    </div>
  );
}
