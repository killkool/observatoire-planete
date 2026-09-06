/** Percentile and same-calendar-day summaries. Null in, null out. Never invent a rank or a mean. */

export const MIN_SAME_DAY_SAMPLE = 5;

export function warmerThanPercent(thisTmax: number | null, seriesTmax: Array<number | null>): number | null {
  if (thisTmax == null) return null;
  const values = seriesTmax.filter((v): v is number => v != null);
  if (values.length < MIN_SAME_DAY_SAMPLE) return null;
  const below = values.filter((v) => v < thisTmax).length;
  return Math.round((below / values.length) * 100);
}

export function meanOfKnown(values: Array<number | null>): { mean: number; n: number } | null {
  const known = values.filter((v): v is number => v != null && Number.isFinite(v));
  if (known.length < MIN_SAME_DAY_SAMPLE) return null;
  const mean = known.reduce((sum, v) => sum + v, 0) / known.length;
  return { mean, n: known.length };
}

export function describeSameDayTmax(thisTmax: number | null, percent: number | null, dayMonthLabel: string, yearCount: number): string | null {
  if (thisTmax == null || percent == null) return null;
  return `Cette journée était plus chaude que ${percent} % des ${dayMonthLabel} disponibles (${yearCount} années).`;
}

export function describeSameDayLead(input: {
  dayMonthLabel: string;
  yearCount: number;
  thisTmin: number | null;
  thisTmax: number | null;
  percentile: number | null;
  isHottest: boolean;
  isColdestMorning: boolean;
}): string | null {
  if (input.yearCount < 1) return null;
  const nLabel = `${input.yearCount} année${input.yearCount > 1 ? "s" : ""}`;
  if (input.isHottest && input.thisTmax != null) {
    return `C’est le ${input.dayMonthLabel} le plus chaud observé ici (${nLabel}).`;
  }
  if (input.isColdestMorning && input.thisTmin != null) {
    return `C’est le ${input.dayMonthLabel} le plus froid le matin observé ici (${nLabel}).`;
  }
  return (
    describeSameDayTmax(input.thisTmax, input.percentile, input.dayMonthLabel, input.yearCount) ||
    `Voici les ${input.dayMonthLabel} observés à cette station (${nLabel}).`
  );
}
