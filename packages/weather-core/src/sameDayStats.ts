/** Percentile helpers. Null in, null out. Never invent a rank. */

export function warmerThanPercent(thisTmax: number | null, seriesTmax: Array<number | null>): number | null {
  if (thisTmax == null) return null;
  const values = seriesTmax.filter((v): v is number => v != null);
  if (values.length < 5) return null;
  const below = values.filter((v) => v < thisTmax).length;
  return Math.round((below / values.length) * 100);
}

export function describeSameDayTmax(thisTmax: number | null, percent: number | null, dayMonthLabel: string, yearCount: number): string | null {
  if (thisTmax == null || percent == null) return null;
  return `Cette journée était plus chaude que ${percent} % des ${dayMonthLabel} disponibles (${yearCount} années).`;
}
