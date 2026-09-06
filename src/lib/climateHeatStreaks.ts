import { roundToPrecision } from "../../packages/weather-core/src/units";

/** Jours consécutifs à Tmax ≥ seuil. Ce n’est pas la canicule officielle Météo-France. */
export const HEAT_STREAK_METHOD = "heat-streak-tmax-v1";
export const HEAT_STREAK_MIN_DAYS = 3;
export const HEAT_STREAK_THRESHOLDS = [30, 35, 40] as const;
export const HEAT_STREAK_METHOD_NOTE =
  "Épisode = au moins 3 jours calendaires consécutifs avec une maximale mesurée ≥ le seuil, sur un seul poste. Un trou ou une Tmax manquante coupe l’épisode. Ce n’est pas la canicule officielle Météo-France (seuils départementaux de Tmin et Tmax).";

export type DailyTmax = {
  date: string;
  tmin: number | null;
  tmax: number | null;
};

export type HeatEpisode = {
  startDate: string;
  endDate: string;
  durationDays: number;
  tmaxMax: number;
  tmaxMean: number;
  tminMin: number | null;
};

export type HeatStreakBand = {
  thresholdC: number;
  episodeCount: number;
  totalDays: number;
  longest: HeatEpisode | null;
  hottest: HeatEpisode | null;
  longestList: HeatEpisode[];
};

export type HeatStreakResult = {
  method: typeof HEAT_STREAK_METHOD;
  minDays: number;
  officialHeatwave: false;
  methodNote: string;
  bands: HeatStreakBand[];
};

export function addUtcDays(isoDate: string, days: number): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return null;
  const utc = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]) + days);
  return new Date(utc).toISOString().slice(0, 10);
}

function closeRun(run: DailyTmax[], minDays: number): HeatEpisode | null {
  if (run.length < minDays) return null;
  const tmaxs = run.map((row) => row.tmax);
  if (tmaxs.some((value) => value == null)) return null;
  const known = tmaxs as number[];
  const tmins = run.map((row) => row.tmin);
  return {
    startDate: run[0].date,
    endDate: run[run.length - 1].date,
    durationDays: run.length,
    tmaxMax: roundToPrecision(Math.max(...known), 1),
    tmaxMean: roundToPrecision(known.reduce((sum, value) => sum + value, 0) / known.length, 1),
    tminMin: tmins.every((value) => value != null) ? roundToPrecision(Math.min(...(tmins as number[])), 1) : null
  };
}

export function heatEpisodesAt(
  days: DailyTmax[],
  thresholdC: number,
  minDays = HEAT_STREAK_MIN_DAYS
): HeatEpisode[] {
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  const episodes: HeatEpisode[] = [];
  let run: DailyTmax[] = [];

  const flush = () => {
    const episode = closeRun(run, minDays);
    if (episode) episodes.push(episode);
    run = [];
  };

  for (const day of sorted) {
    const hot = day.tmax != null && Number.isFinite(day.tmax) && day.tmax >= thresholdC;
    if (!hot) {
      flush();
      continue;
    }
    if (run.length && addUtcDays(run[run.length - 1].date, 1) !== day.date) {
      flush();
    }
    run.push(day);
  }
  flush();
  return episodes;
}

function pickLongest(episodes: HeatEpisode[]): HeatEpisode | null {
  return episodes.reduce<HeatEpisode | null>((best, episode) => {
    if (!best) return episode;
    if (episode.durationDays !== best.durationDays) {
      return episode.durationDays > best.durationDays ? episode : best;
    }
    if (episode.tmaxMean !== best.tmaxMean) {
      return episode.tmaxMean > best.tmaxMean ? episode : best;
    }
    return episode.startDate > best.startDate ? episode : best;
  }, null);
}

function pickHottest(episodes: HeatEpisode[]): HeatEpisode | null {
  return episodes.reduce<HeatEpisode | null>((best, episode) => {
    if (!best) return episode;
    if (episode.tmaxMean !== best.tmaxMean) {
      return episode.tmaxMean > best.tmaxMean ? episode : best;
    }
    if (episode.tmaxMax !== best.tmaxMax) {
      return episode.tmaxMax > best.tmaxMax ? episode : best;
    }
    if (episode.durationDays !== best.durationDays) {
      return episode.durationDays > best.durationDays ? episode : best;
    }
    return episode.startDate > best.startDate ? episode : best;
  }, null);
}

export function longestEpisodes(episodes: HeatEpisode[], limit = 5): HeatEpisode[] {
  return [...episodes]
    .sort((a, b) => {
      if (b.durationDays !== a.durationDays) return b.durationDays - a.durationDays;
      if (b.tmaxMean !== a.tmaxMean) return b.tmaxMean - a.tmaxMean;
      return b.startDate.localeCompare(a.startDate);
    })
    .slice(0, limit);
}

function bandFor(days: DailyTmax[], thresholdC: number): HeatStreakBand {
  const episodes = heatEpisodesAt(days, thresholdC);
  return {
    thresholdC,
    episodeCount: episodes.length,
    totalDays: episodes.reduce((sum, episode) => sum + episode.durationDays, 0),
    longest: pickLongest(episodes),
    hottest: pickHottest(episodes),
    longestList: longestEpisodes(episodes, 5)
  };
}

export function emptyHeatStreaks(): HeatStreakResult {
  return {
    method: HEAT_STREAK_METHOD,
    minDays: HEAT_STREAK_MIN_DAYS,
    officialHeatwave: false,
    methodNote: HEAT_STREAK_METHOD_NOTE,
    bands: HEAT_STREAK_THRESHOLDS.map((thresholdC) => ({
      thresholdC,
      episodeCount: 0,
      totalDays: 0,
      longest: null,
      hottest: null,
      longestList: []
    }))
  };
}

export function stationHeatStreaks(days: DailyTmax[]): HeatStreakResult {
  return {
    method: HEAT_STREAK_METHOD,
    minDays: HEAT_STREAK_MIN_DAYS,
    officialHeatwave: false,
    methodNote: HEAT_STREAK_METHOD_NOTE,
    bands: HEAT_STREAK_THRESHOLDS.map((thresholdC) => bandFor(days, thresholdC))
  };
}
