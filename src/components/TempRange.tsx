export default function TempRange({
  tmin,
  tmax
}: {
  tmin: number | null;
  tmax: number | null;
}) {
  if (tmin == null && tmax == null) {
    return <div className="tempRange emptyRange">Températures non disponibles pour ce jour</div>;
  }
  const lo = tmin ?? tmax ?? 0;
  const hi = tmax ?? tmin ?? 0;
  const minBound = Math.min(-10, Math.floor(lo) - 5);
  const maxBound = Math.max(40, Math.ceil(hi) + 5);
  const span = maxBound - minBound || 1;
  const left = ((lo - minBound) / span) * 100;
  const width = Math.max(4, ((hi - lo) / span) * 100);

  return (
    <div className="tempRange">
      <div className="tempLabels">
        <span>{tmin == null ? "Tmin —" : `${tmin.toFixed(1)}°`}</span>
        <span>{tmax == null ? "Tmax —" : `${tmax.toFixed(1)}°`}</span>
      </div>
      <div className="tempTrack" aria-hidden="true">
        <div className="tempFill" style={{ left: `${left}%`, width: `${width}%` }} />
      </div>
      <div className="tempScale">
        <span>{minBound}°C</span>
        <span>0</span>
        <span>{maxBound}°C</span>
      </div>
    </div>
  );
}
