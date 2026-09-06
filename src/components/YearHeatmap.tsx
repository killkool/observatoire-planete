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

export default function YearHeatmap({ series, selected, onSelect }: { series: YearPoint[]; selected?: string; onSelect?: (date: string) => void }) {
  if (!series.length) return null;
  return (
    <div className="yearHeat">
      <div className="yearHeatGrid">
        {series.map((row) => (
          <button
            key={row.date}
            type="button"
            className={`yearCell${row.date === selected ? " on" : ""}`}
            style={{ background: colorFor(row.tmax) }}
            title={`${row.date} · Tmin ${row.tmin ?? "—"} · Tmax ${row.tmax ?? "—"}`}
            onClick={() => onSelect?.(row.date)}
          >
            <em>{row.date.slice(0, 4)}</em>
          </button>
        ))}
      </div>
      <p className="yearHeatLegend">
        Chaque case est une année réelle observée — couleur selon Tmax. Cliquer ouvre cette année.
      </p>
    </div>
  );
}
