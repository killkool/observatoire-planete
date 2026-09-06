export function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function frenchLongDate(isoDate: string): string | null {
  if (!isIsoDate(isoDate)) return null;
  const date = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== isoDate) return null;
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  }).format(date);
}

export function yearsElapsed(isoDate: string, todayIso: string): number | null {
  if (!isIsoDate(isoDate) || !isIsoDate(todayIso)) return null;
  if (isoDate > todayIso) return null;
  const [y, m, d] = isoDate.split("-").map(Number);
  const [ty, tm, td] = todayIso.split("-").map(Number);
  let years = ty - y;
  if (tm < m || (tm === m && td < d)) years -= 1;
  return years;
}

export function communeHistoryHref(
  path: string,
  isoDate: string,
  histoire?: "naissance"
): string {
  const params = new URLSearchParams();
  params.set("date", isoDate);
  if (histoire) params.set("histoire", histoire);
  return `${path}?${params.toString()}`;
}

export function buildShareText(input: {
  placeName: string;
  isoDate: string;
  hasObservation: boolean;
  tminDisplay?: string | null;
  tmaxDisplay?: string | null;
  precipDisplay?: string | null;
  stationName?: string | null;
  distanceKm?: number | null;
  url: string;
}): string {
  const when = frenchLongDate(input.isoDate) || input.isoDate;
  if (!input.hasObservation) {
    return `Le ${when} à ${input.placeName} : aucune mesure officielle n’est disponible. Aucune valeur n’est inventée. ${input.url}`;
  }
  const tmin = input.tminDisplay || "non disponible";
  const tmax = input.tmaxDisplay || "non disponible";
  const rain = input.precipDisplay || "non disponible";
  const station =
    input.stationName && input.distanceKm != null
      ? ` Mesure officielle (station ${input.stationName}, ${input.distanceKm} km).`
      : input.stationName
        ? ` Mesure officielle (station ${input.stationName}).`
        : " Mesure officielle.";
  return `Le ${when} à ${input.placeName} : minimale ${tmin}, maximale ${tmax}, pluie ${rain}.${station} ${input.url}`;
}
