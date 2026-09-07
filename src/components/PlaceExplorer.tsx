"use client";

import { useEffect, useMemo, useState, type ComponentProps } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import DeferInView from "./DeferInView";
import TempRange from "./TempRange";
import YearHeatmap from "./YearHeatmap";
import OriginBadge from "./OriginBadge";
import { departmentLabel } from "@/lib/placeUrl";
import { buildBirthLead, buildShareText, communeHistoryHref, frenchLongDate, yearsElapsed } from "@/lib/birthDay";
import { buildClimateShareText } from "@/lib/shareCard";
import {
  compareCompleteSeasons,
  compareCompleteYears,
  formatSignedCelsius,
  formatSignedMm
} from "@/lib/compareClimate";
import { formatCelsius, formatDaysFrost, formatDaysGe30, formatMeanAmplitudeC, formatMm, formatTropicalNights } from "../../packages/weather-core/src/units";
import { ERA5_FRANCE_DAILY_2T_CELLS, ERA5_FRANCE_DAILY_2T_DATES, ERA5_POINT_DATES } from "@/lib/era5France";
import { formatSignedPerDecade } from "@/lib/climateTrend";
import {
  coldestCompleteSeasonOf,
  hottestCompleteSeasonOf,
  SEASON_CODES,
  seasonPublicLabel,
  seasonSelectLabel,
  type SeasonCode
} from "@/lib/climateSeasons";
import { type HeatEpisode, type HeatStreakResult } from "@/lib/climateHeatStreaks";
import {
  compareCompleteMonths,
  formatMonthYear,
  monthChartRows,
  monthNameFr,
  monthShortFr,
  yearsWithAnyCompleteMonth,
  yearsWithTwelveCompleteMonths
} from "@/lib/climateMonths";

const PlaceMapCanvas = dynamic(() => import("./PlaceMap"), {
  ssr: false,
  loading: () => <div className="mapCanvas mapPlaceholder">Carte IGN…</div>
});
const ClimateLineChartCanvas = dynamic(() => import("./ClimateLineChart"), {
  ssr: false,
  loading: () => <div className="chart" aria-hidden />
});

function PlaceMap(props: ComponentProps<typeof PlaceMapCanvas>) {
  return (
    <DeferInView fallback={<div className="mapCanvas mapPlaceholder">Carte IGN…</div>}>
      <PlaceMapCanvas {...props} />
    </DeferInView>
  );
}

function ClimateLineChart(props: ComponentProps<typeof ClimateLineChartCanvas>) {
  return (
    <DeferInView fallback={<div className="chart" aria-hidden />}>
      <ClimateLineChartCanvas {...props} />
    </DeferInView>
  );
}

/** Page HTML lite : mois/saisons/chaleur absents, pas « aucune donnée ». */
function climateDetailsPending(yearly: YearlyPayload | null): boolean {
  if (!yearly?.computed) return false;
  if (yearly.detailRows === false) return true;
  if (yearly.detailRows === true) return false;
  return !(yearly.months && yearly.months.length);
}

type HistoryPayload = {
  date: string;
  place: { name: string; insee_code: string; latitude: number; longitude: number; altitude_m: number | null; timezone: string; department_slug?: string };
  preferredStation: {
    id: string;
    name: string;
    latitude: number | null;
    longitude: number | null;
    altitudeM: number | null;
    distanceKm: number | null;
    altitudeDeltaM: number | null;
    matchScore?: number | null;
    matchMethod?: string;
  } | null;
  nearbyStations: {
    id: string;
    name: string;
    latitude: number | null;
    longitude: number | null;
    distanceKm: number | null;
    altitudeM: number | null;
  }[];
  observation: {
    originType?: string;
    originLabel: string;
    sourceId: string;
    tminDisplay: string;
    tmaxDisplay: string;
    tmeanDisplay: string;
    precipDisplay: string;
    tmin: number | null;
    tmax: number | null;
    precipitationMm?: number | null;
  } | null;
  era5: {
    originType: string;
    originLabel: string;
    originLabelTechnical: string;
    method: string;
    methodVersion: string | null;
    datasetVersion: string | null;
    gridLatitude: number | null;
    gridLongitude: number | null;
    tminDisplay: string;
    tmaxDisplay: string;
    tmin: number | null;
    tmax: number | null;
    dewpointMin?: number | null;
    dewpointMax?: number | null;
    dewpointMinDisplay?: string;
    dewpointMaxDisplay?: string;
    precipMm?: number | null;
    precipDisplay?: string;
    precipDelta?: number | null;
    windSpeedMs?: number | null;
    windSpeedDisplay?: string;
    windFromDeg?: number | null;
    windFromDisplay?: string;
    mslHpa?: number | null;
    mslDisplay?: string;
    spHpa?: number | null;
    spDisplay?: string;
    modelSurfaceAltitudeM?: number | null;
    snowSweMm?: number | null;
    snowSweDisplay?: string;
    ssrdMj?: number | null;
    ssrdDisplay?: string;
    gustMs?: number | null;
    gustDisplay?: string;
  } | null;
  comparison: { tminDelta: number | null; tmaxDelta: number | null; note: string } | null;
  recordsObserved: {
    originLabel: string;
    recordTmin: number | null;
    recordTmax: number | null;
    recordTminDate: string | null;
    recordTmaxDate: string | null;
    yearsOnThisDay: number;
  } | null;
  seriesSameDay: { date: string; tmin: number | null; tmax: number | null }[];
  sameDayContext: {
    tmaxPercentile: number | null;
    tminMean: number | null;
    tmaxMean: number | null;
    n: number;
    label: string | null;
  } | null;
  stationDisclaimer: string | null;
  confidence: { score: number; methodVersion: string; breakdown: { label: string; delta: number }[] };
  attributions: string[];
};

type YearRow = {
  year: number;
  tminMean: number | null;
  tmaxMean: number | null;
  precipitationSum: number | null;
  daysRain?: number;
  daysGe25?: number;
  daysGe30: number;
  daysGe35?: number;
  daysGe40?: number;
  daysFrost?: number;
  tropicalNights?: number;
  amplitude?: number;
  yearComplete: boolean;
  precipComplete: boolean;
  tminAnomaly?: number | null;
  tmaxAnomaly?: number | null;
};

type SeasonRow = {
  year: number;
  season: "DJF" | "MAM" | "JJA" | "SON";
  tminMean: number | null;
  tmaxMean: number | null;
  precipitationSum: number | null;
  daysGe30: number;
  seasonComplete: boolean;
  precipComplete: boolean;
};

type MonthRow = {
  year: number;
  month: number;
  tminMean: number | null;
  tmaxMean: number | null;
  precipitationSum: number | null;
  daysGe30: number;
  monthComplete: boolean;
  precipComplete: boolean;
};

type YearlyPayload = {
  computed: boolean;
  detailRows?: boolean;
  methodVersion: string;
  completeDayThreshold: number;
  completeMonthDayThreshold: number;
  completeSeasonDayThreshold: number;
  station: { id: string; name: string; distanceKm: number | null; completeYears: number } | null;
  disclaimer: string | null;
  years: YearRow[];
  seasons?: SeasonRow[];
  summers: SeasonRow[];
  hottestSummer: SeasonRow | null;
  coldestWinter?: SeasonRow | null;
  months?: MonthRow[];
  monthRecords?: {
    hottest: { year: number; month: number; value: number } | null;
    coldest: { year: number; month: number; value: number } | null;
    wettest: { year: number; month: number; value: number } | null;
  };
  monthNormal?: {
    period: string;
    methodVersion: string;
    minYearsRequired: number;
    available: boolean;
    sameStation: boolean;
    yearsUsed: number;
    station: { id: string; name: string; distanceKm: number | null } | null;
    reason: string | null;
    months: {
      month: number;
      yearsUsed: number;
      yearsPrecip: number;
      available: boolean;
      precipAvailable: boolean;
      tminMean: number | null;
      tmaxMean: number | null;
      precipitationMean: number | null;
    }[];
  };
  normal: {
    period: string;
    minYearsRequired: number;
    available: boolean;
    sameStation: boolean;
    yearsUsed: number;
    station: { id: string; name: string; distanceKm: number | null } | null;
    tminMean: number | null;
    tmaxMean: number | null;
    precipitationMean: number | null;
    precipAvailable: boolean;
    reason: string | null;
  };
  yearRecords: {
    periodFrom: number | null;
    periodTo: number | null;
    yearsUsed: number;
    hottest: { year: number; value: number } | null;
    coldest: { year: number; value: number } | null;
    wettest: { year: number; value: number } | null;
    mostDaysGe30: { year: number; value: number } | null;
    mostFrost: { year: number; value: number } | null;
    mostTropicalNights: { year: number; value: number } | null;
  };
  warming: {
    method: string;
    homogenized: false;
    minYears: number;
    windowYears: number;
    methodNote: string;
    linear:
      | { available: false; reason: string }
      | {
          available: true;
          from: number;
          to: number;
          n: number;
          tmaxPerDecade: number | null;
          tminPerDecade: number | null;
          daysGe30PerDecade: number | null;
          frostPerDecade: number | null;
          tropicalNightsPerDecade: number | null;
          shortSeries: boolean;
        };
    windows:
      | { comparable: false; reason: string }
      | {
          comparable: true;
          early: {
            from: number;
            to: number;
            n: number;
            tminMean: number | null;
            tmaxMean: number | null;
            daysGe30Mean: number | null;
            frostMean: number | null;
            tropicalNightsMean: number | null;
          };
          late: {
            from: number;
            to: number;
            n: number;
            tminMean: number | null;
            tmaxMean: number | null;
            daysGe30Mean: number | null;
            frostMean: number | null;
            tropicalNightsMean: number | null;
          };
          tminDelta: number | null;
          tmaxDelta: number | null;
          daysGe30Delta: number | null;
          frostDelta: number | null;
          tropicalNightsDelta: number | null;
        };
  };
  heat?: HeatStreakResult;
};

type ChildhoodPayload = {
  computed: boolean;
  station: { id: string; name: string; distanceKm: number | null } | null;
  disclaimer: string | null;
  comparison:
    | { comparable: false; reason: string }
    | {
        comparable: true;
        childhood: { from: number; to: number; n: number; tminMean: number | null; tmaxMean: number | null };
        recent: { from: number; to: number; n: number; tminMean: number | null; tmaxMean: number | null };
        tminDelta: number | null;
        tmaxDelta: number | null;
      };
};

export default function PlaceExplorer({
  slug,
  initialDate,
  initialHistory = null,
  initialYearly = null,
  initialChildhood = null,
  histoire = false,
  dateInQuery = false,
  climateLead = null
}: {
  slug: string;
  initialDate: string;
  initialHistory?: HistoryPayload | null;
  initialYearly?: YearlyPayload | null;
  initialChildhood?: ChildhoodPayload | null;
  histoire?: boolean;
  dateInQuery?: boolean;
  climateLead?: {
    year: number;
    tminMean: number | null;
    tmaxMean: number | null;
    precipitationSum: number | null;
    precipComplete: boolean;
    daysRain?: number;
    daysGe25?: number;
    daysGe30: number;
    daysGe35?: number;
    daysGe40?: number;
    daysFrost?: number;
    tropicalNights?: number;
    amplitude?: number;
    stationName: string;
    distanceKm: number | null;
  } | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [date, setDate] = useState(initialDate);
  const [data, setData] = useState<HistoryPayload | null>(() =>
    initialHistory && initialHistory.date === initialDate ? initialHistory : null
  );
  const [yearly, setYearly] = useState<YearlyPayload | null>(initialYearly);
  const [childhood, setChildhood] = useState<ChildhoodPayload | null>(
    histoire && initialChildhood ? initialChildhood : null
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(() => {
    if (!dateInQuery && !histoire) return false;
    return !(initialHistory && initialHistory.date === initialDate);
  });
  const [copied, setCopied] = useState(false);
  const [shareFallback, setShareFallback] = useState("");
  const [yearA, setYearA] = useState<number | null>(null);
  const [yearB, setYearB] = useState<number | null>(null);
  const [seasonKind, setSeasonKind] = useState<SeasonCode>("DJF");
  const [seasonYearA, setSeasonYearA] = useState<number | null>(null);
  const [seasonYearB, setSeasonYearB] = useState<number | null>(null);
  const [monthYear, setMonthYear] = useState<number | null>(null);
  const [monthKind, setMonthKind] = useState(7);
  const [monthYearA, setMonthYearA] = useState<number | null>(null);
  const [monthYearB, setMonthYearB] = useState<number | null>(null);

  const ready = Boolean(data && data.date === date);
  const showClimateHero =
    !histoire &&
    !dateInQuery &&
    climateLead != null &&
    climateLead.tmaxMean != null &&
    date === initialDate;

  useEffect(() => {
    setDate(initialDate);
  }, [initialDate]);

  function goToDate(next: string) {
    if (!next) return;
    setDate(next);
    setShareFallback("");
    setCopied(false);
    router.push(communeHistoryHref(pathname, next, histoire ? "naissance" : undefined));
  }

  async function copyShare() {
    const text =
      showClimateHero && climateLead
        ? buildClimateShareText({
            placeName: yearly?.commune?.name || slug,
            year: climateLead.year,
            tminMean: climateLead.tminMean,
            tmaxMean: climateLead.tmaxMean,
            precipitationSum: climateLead.precipitationSum,
            precipComplete: climateLead.precipComplete,
            daysRain: climateLead.daysRain,
            daysGe25: climateLead.daysGe25,
            daysGe30: climateLead.daysGe30,
            daysGe35: climateLead.daysGe35,
            daysGe40: climateLead.daysGe40,
            daysFrost: climateLead.daysFrost,
            tropicalNights: climateLead.tropicalNights,
            stationName: climateLead.stationName,
            distanceKm: climateLead.distanceKm,
            url: `${window.location.origin}${pathname}`
          })
        : data?.place
          ? buildShareText({
              placeName: data.place.name,
              isoDate: date,
              hasObservation: Boolean(data.observation),
              tminDisplay: data.observation?.tminDisplay,
              tmaxDisplay: data.observation?.tmaxDisplay,
              precipDisplay: data.observation?.precipDisplay,
              stationName: data.preferredStation?.name,
              distanceKm: data.preferredStation?.distanceKm,
              url: `${window.location.origin}${pathname}?date=${date}${histoire ? "&histoire=naissance" : ""}`
            })
          : null;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setShareFallback("");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setShareFallback(text);
      setCopied(false);
    }
  }

  useEffect(() => {
    if (!dateInQuery && !histoire && date === initialDate) {
      setData(null);
      setLoading(false);
      return;
    }
    if (initialHistory && initialHistory.date === date) {
      setData(initialHistory);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetch(`/api/v1/history?place=${slug}&date=${date}`, { signal: controller.signal })
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || "Erreur");
        return j as HistoryPayload;
      })
      .then(setData)
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [slug, date, initialHistory, dateInQuery, histoire, initialDate]);

  const insee = data?.place?.insee_code || yearly?.commune?.insee;
  useEffect(() => {
    if (initialYearly) setYearly(initialYearly);
  }, [initialYearly]);

  useEffect(() => {
    if (!insee) return;
    const needsDetailRows = !initialYearly || climateDetailsPending(initialYearly);
    if (!needsDetailRows) return;
    const target = document.getElementById("mois");
    if (!target) return;
    const controller = new AbortController();
    const load = () => {
      fetch(`/api/v1/communes/${insee}/yearly`, { signal: controller.signal })
        .then(async (r) => {
          const j = await r.json();
          if (!r.ok) throw new Error(j.error || "Erreur statistiques");
          return j as YearlyPayload;
        })
        .then(setYearly)
        .catch((e) => {
          if (e.name !== "AbortError" && !initialYearly) setYearly(null);
        });
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          load();
          io.disconnect();
        }
      },
      { rootMargin: "480px" }
    );
    io.observe(target);
    return () => {
      io.disconnect();
      controller.abort();
    };
  }, [insee, initialYearly]);

  useEffect(() => {
    if (!histoire || !insee) {
      setChildhood(null);
      return;
    }
    const birthYear = Number(date.slice(0, 4));
    if (!Number.isInteger(birthYear)) {
      setChildhood(null);
      return;
    }
    if (initialChildhood && Number(initialDate.slice(0, 4)) === birthYear) {
      setChildhood(initialChildhood);
      return;
    }
    const controller = new AbortController();
    fetch(`/api/v1/communes/${insee}/childhood?birthYear=${birthYear}`, { signal: controller.signal })
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || "Erreur enfance");
        return j as ChildhoodPayload;
      })
      .then(setChildhood)
      .catch((e) => {
        if (e.name !== "AbortError") setChildhood(null);
      });
    return () => controller.abort();
  }, [histoire, insee, date, initialChildhood, initialDate]);

  const chart = useMemo(
    () => (data?.seriesSameDay || []).map((row) => ({ year: row.date.slice(0, 4), tmin: row.tmin, tmax: row.tmax })),
    [data]
  );

  const yearlyChart = useMemo(
    () =>
      (yearly?.years || [])
        .filter((row) => row.yearComplete)
        .map((row) => ({ year: String(row.year), tmin: row.tminMean, tmax: row.tmaxMean })),
    [yearly]
  );

  const completeYears = useMemo(
    () => (yearly?.years || []).filter((row) => row.yearComplete),
    [yearly]
  );
  const allSeasons = useMemo(
    () => yearly?.seasons || yearly?.summers || [],
    [yearly]
  );
  const completeSeasons = useMemo(
    () => allSeasons.filter((row) => row.seasonComplete && row.season === seasonKind),
    [allSeasons, seasonKind]
  );
  const seasonChart = useMemo(
    () => completeSeasons.map((row) => ({ year: String(row.year), tmin: row.tminMean, tmax: row.tmaxMean })),
    [completeSeasons]
  );
  const seasonCopy = seasonPublicLabel(seasonKind);
  const seasonRecord =
    seasonCopy.recordKind === "coldest"
      ? coldestCompleteSeasonOf(allSeasons, seasonKind)
      : hottestCompleteSeasonOf(allSeasons, seasonKind);
  const monthYearsFull = useMemo(
    () => yearsWithTwelveCompleteMonths(yearly?.months || []),
    [yearly]
  );
  const monthYearsAny = useMemo(
    () => yearsWithAnyCompleteMonth(yearly?.months || []),
    [yearly]
  );
  const monthChart = useMemo(
    () =>
      monthYear != null
        ? monthChartRows(
            yearly?.months || [],
            monthYear,
            yearly?.monthNormal?.available && yearly.monthNormal.sameStation ? yearly.monthNormal.months : null
          )
        : [],
    [yearly, monthYear]
  );
  const monthNormalChart = useMemo(
    () =>
      (yearly?.monthNormal?.available ? yearly.monthNormal.months : []).map((row) => ({
        label: monthShortFr(row.month),
        tmin: row.tminMean,
        tmax: row.tmaxMean
      })),
    [yearly]
  );
  const completeMonthPairs = useMemo(
    () => (yearly?.months || []).filter((row) => row.monthComplete && row.month === monthKind),
    [yearly, monthKind]
  );

  useEffect(() => {
    if (!completeYears.length) {
      setYearA(null);
      setYearB(null);
      return;
    }
    setYearA(completeYears[0].year);
    setYearB(completeYears[completeYears.length - 1].year);
  }, [completeYears]);

  useEffect(() => {
    if (!completeSeasons.length) {
      setSeasonYearA(null);
      setSeasonYearB(null);
      return;
    }
    setSeasonYearA(completeSeasons[0].year);
    setSeasonYearB(completeSeasons[completeSeasons.length - 1].year);
  }, [completeSeasons]);

  const yearCompare = useMemo(() => {
    if (yearA == null || yearB == null || !yearly) return null;
    return compareCompleteYears(
      yearly.years.find((row) => row.year === yearA),
      yearly.years.find((row) => row.year === yearB)
    );
  }, [yearly, yearA, yearB]);

  const seasonCompare = useMemo(() => {
    if (seasonYearA == null || seasonYearB == null || !allSeasons.length) return null;
    return compareCompleteSeasons(
      allSeasons.find((row) => row.year === seasonYearA && row.season === seasonKind),
      allSeasons.find((row) => row.year === seasonYearB && row.season === seasonKind)
    );
  }, [allSeasons, seasonKind, seasonYearA, seasonYearB]);

  const heatBand30 = yearly?.heat?.bands.find((band) => band.thresholdC === 30);
  const heatBand35 = yearly?.heat?.bands.find((band) => band.thresholdC === 35);
  const heatBand40 = yearly?.heat?.bands.find((band) => band.thresholdC === 40);

  useEffect(() => {
    const next = monthYearsFull.at(-1) ?? monthYearsAny.at(-1) ?? null;
    setMonthYear(next);
  }, [monthYearsFull, monthYearsAny]);

  useEffect(() => {
    if (completeMonthPairs.length < 2) {
      setMonthYearA(null);
      setMonthYearB(null);
      return;
    }
    setMonthYearA(completeMonthPairs[0].year);
    setMonthYearB(completeMonthPairs[completeMonthPairs.length - 1].year);
  }, [completeMonthPairs]);

  const monthCompare = useMemo(() => {
    if (monthYearA == null || monthYearB == null || !yearly) return null;
    return compareCompleteMonths(
      (yearly.months || []).find((row) => row.year === monthYearA && row.month === monthKind),
      (yearly.months || []).find((row) => row.year === monthYearB && row.month === monthKind)
    );
  }, [yearly, monthKind, monthYearA, monthYearB]);

  const place = data?.place;
  const displayName = place?.name || yearly?.commune?.name || slug;

  return (
    <main className="placeVisual">
      <section className="placeHero">
        <div className="placeHeroContent">
          <p className="crumb">
            <Link href="/">Accueil</Link>
            <span>
              {" "}
              /               {place?.department_slug ? `${departmentLabel(place.department_slug)} / ` : ""}
              {displayName}
            </span>
          </p>
          <p className="eyebrow">
            {histoire
              ? "JOUR DE NAISSANCE · MESURE OFFICIELLE"
              : showClimateHero
                ? "CLIMAT OBSERVÉ · ANNÉE COMPLÈTE"
                : "HISTOIRE MÉTÉO · MESURE OFFICIELLE"}
          </p>
          <h1>{displayName}</h1>
          {showClimateHero ? null : <p>{date.split("-").reverse().join("/")}</p>}
          {showClimateHero && climateLead ? (
            <>
              <p className="heroTemps">
                <span>
                  <em>Année</em>
                  {climateLead.year}
                </span>
                {climateLead.tminMean != null ? (
                  <span>
                    <em>Minimale moyenne</em>
                    {formatCelsius(climateLead.tminMean)}
                  </span>
                ) : null}
                <span>
                  <em>Maximale moyenne</em>
                  {formatCelsius(climateLead.tmaxMean)}
                </span>
                {climateLead.amplitude != null ? (
                  <span>
                    <em>Écart min-max</em>
                    {formatCelsius(climateLead.amplitude)}
                  </span>
                ) : null}
                {climateLead.precipComplete && climateLead.precipitationSum != null ? (
                  <span>
                    <em>Pluie</em>
                    {formatMm(climateLead.precipitationSum)}
                  </span>
                ) : null}
                {climateLead.precipComplete && climateLead.daysRain != null ? (
                  <span>
                    <em>Jours de pluie</em>
                    {climateLead.daysRain}
                  </span>
                ) : null}
                {climateLead.daysGe25 != null ? (
                  <span>
                    <em>Jours ≥ 25 °C</em>
                    {climateLead.daysGe25}
                  </span>
                ) : null}
                <span>
                  <em>Jours ≥ 30 °C</em>
                  {climateLead.daysGe30}
                </span>
                {climateLead.daysGe35 != null ? (
                  <span>
                    <em>Jours ≥ 35 °C</em>
                    {climateLead.daysGe35}
                  </span>
                ) : null}
                {climateLead.daysGe40 != null ? (
                  <span>
                    <em>Jours ≥ 40 °C</em>
                    {climateLead.daysGe40}
                  </span>
                ) : null}
                {climateLead.daysFrost != null ? (
                  <span>
                    <em>Jours de gel</em>
                    {climateLead.daysFrost}
                  </span>
                ) : null}
                {climateLead.tropicalNights != null ? (
                  <span>
                    <em>Nuits tropicales</em>
                    {climateLead.tropicalNights}
                  </span>
                ) : null}
              </p>
              <p className="heroStation">
                Station {climateLead.stationName}
                {climateLead.distanceKm != null ? ` (${climateLead.distanceKm} km)` : ""}. Année climatique complète, pas une prévision.
              </p>
            </>
          ) : data && data.date === date && data.observation ? (
            <>
              <p className="heroTemps">
                <span>
                  <em>Minimale</em>
                  {data.observation.tminDisplay}
                </span>
                <span>
                  <em>Maximale</em>
                  {data.observation.tmaxDisplay}
                </span>
                <span>
                  <em>Pluie</em>
                  {data.observation.precipDisplay}
                </span>
              </p>
              {data.stationDisclaimer ? <p className="heroStation">{data.stationDisclaimer}</p> : null}
            </>
          ) : data && data.date === date && !data.observation ? (
            <p className="heroTempsEmpty">
              Aucune mesure officielle n’est disponible pour cette date. Aucune valeur n’est inventée.
            </p>
          ) : null}
          <div className="heroActions">
            <label className="datePick">
              <span>{histoire ? "Date de naissance" : "Quel temps faisait-il ?"}</span>
              <input
                type="date"
                value={showClimateHero ? "" : date}
                onChange={(e) => goToDate(e.target.value)}
              />
            </label>
            <button type="button" className="btnGhost shareBtn" onClick={copyShare}>
              {copied
                ? showClimateHero
                  ? "Année copiée"
                  : "Souvenir copié"
                : showClimateHero
                  ? "Partager cette année"
                  : "Partager ce jour"}
            </button>
          </div>
          {shareFallback ? (
            <textarea className="shareFallback" readOnly value={shareFallback} rows={4} />
          ) : null}
        </div>
      </section>

      {error && <div className="error">{error}</div>}
      {loading && !ready && !showClimateHero && <p className="note loadingNote">Chargement des observations…</p>}

      {histoire && place && data && (
        <section className="panel birthPanel">
          <div className="panelTitle">
            <div>
              <span>CE JOUR-LÀ</span>
              <h2>{frenchLongDate(date) || date}</h2>
            </div>
            {(() => {
              const age = yearsElapsed(date, new Date().toISOString().slice(0, 10));
              return age != null ? (
                <strong>
                  Il y a {age} an{age > 1 ? "s" : ""}
                </strong>
              ) : null;
            })()}
          </div>
          <p className="birthLead">
            {buildBirthLead({
              hasObservation: Boolean(data.observation),
              tminDisplay: data.observation?.tminDisplay,
              tmaxDisplay: data.observation?.tmaxDisplay,
              precipDisplay: data.observation?.precipDisplay,
              stationDisclaimer: data.stationDisclaimer
            })}
          </p>
        </section>
      )}

      {place && (
        <section className="mapBlock panel">
          <div className="panelTitle">
            <div>
              <span>GÉOGRAPHIE RÉELLE</span>
              <h2>Où se trouve la mesure</h2>
            </div>
            <strong>Photo IGN, pas une illustration</strong>
          </div>
          <PlaceMap
            placeName={place.name}
            placeLat={place.latitude}
            placeLon={place.longitude}
            station={data?.preferredStation}
            nearby={data?.nearbyStations}
          />
        </section>
      )}

      {data && !data.preferredStation ? (
        <div className="placeDayFlow">
          <section className="empty panel">
            <h2>Aucune mesure officielle</h2>
            <p>Aucune valeur n’est inventée pour cette date.</p>
          </section>
        </div>
      ) : null}

      {data?.preferredStation ? (
        <div className="placeDayFlow">
          <section className="storyGrid">
            <article className="panel storyMain">
              <OriginBadge kind="OBSERVED" caption={data.observation?.originLabel} />
              <TempRange tmin={data.observation?.tmin ?? null} tmax={data.observation?.tmax ?? null} />
              {data.sameDayContext ? <p className="sameDayStory">{data.sameDayContext.label}</p> : null}
              <div className="metricRow">
                <div>
                  <span>Pluie</span>
                  <strong>{data.observation?.precipDisplay || "Non disponible"}</strong>
                </div>
                <div>
                  <span>Moyenne</span>
                  <strong>{data.observation?.tmeanDisplay || "Non disponible"}</strong>
                </div>
              </div>
              {data.stationDisclaimer ? <p className="stationDisclaimer">{data.stationDisclaimer}</p> : null}
            </article>
            <article className="panel storySide">
              <h2 className="subh">Sources</h2>
              <p>
                Source : Météo-France.
                {data.preferredStation ? ` Station utilisée : ${data.preferredStation.name}.` : ""}
              </p>
              <p>
                Confiance interne {data.confidence.score}/100
                {data.era5
                  ? ". L’estimation climatique n’est pas une seconde mesure indépendante."
                  : "."}
              </p>
            </article>
          </section>

          <section id="comparaison-sources" className="panel sourceCompare">
            <div className="panelTitle">
              <div>
                <span>COMPARAISON</span>
                <h2>Mesure et estimation climatique</h2>
              </div>
            </div>
            {data.era5 && data.comparison ? (
              <>
                <div className="sourceCompareGrid">
                  <article>
                    <OriginBadge kind="OBSERVED" caption={data.preferredStation?.name} />
                    <p className="sourceTemps">
                      {data.observation?.tminDisplay} / {data.observation?.tmaxDisplay}
                    </p>
                    <p className="sourceNote">Station {data.preferredStation?.name}.</p>
                  </article>
                  <article>
                    <OriginBadge kind="REANALYSIS" caption="Pas une station" />
                    <p className="sourceTemps">
                      {data.era5.tminDisplay} / {data.era5.tmaxDisplay}
                    </p>
                    <p className="sourceNote">Pas une mesure de station. Pas fusionnée avec la mesure.</p>
                  </article>
                </div>
                <p className="deltaLine">
                  Écart estimation − mesure : Tmin {formatSignedCelsius(data.comparison.tminDelta)} · Tmax{" "}
                  {formatSignedCelsius(data.comparison.tmaxDelta)}
                </p>
                <p className="yearlyNote">{data.comparison.note}</p>
                <p className="yearlyNote">
                  Qualité : aucun flag dans l’import quotidien Météo-France pour cette date. Rien n’est inventé.
                </p>
                <p className="yearlyNote">
                  Confiance interne {data.confidence.score}/100 ({data.confidence.methodVersion}).
                </p>
                <div className="confidenceBars">
                  {data.confidence.breakdown.map((b) => (
                    <div key={b.label}>
                      <span>{b.label}</span>
                      <em>{b.delta > 0 ? `+${b.delta}` : b.delta}</em>
                    </div>
                  ))}
                </div>
                <details className="techDetails">
                  <summary>En savoir plus</summary>
                  <p>
                    Réanalyse ERA5 (Copernicus C3S / ECMWF), origine technique {data.era5.originLabelTechnical}.
                    Méthode {data.era5.method}
                    {data.era5.methodVersion ? ` (${data.era5.methodVersion})` : ""}.
                    {data.era5.datasetVersion ? ` Version ${data.era5.datasetVersion}.` : ""}
                    {data.era5.gridLatitude != null && data.era5.gridLongitude != null
                      ? ` Maille la plus proche ${data.era5.gridLatitude}°N, ${data.era5.gridLongitude}°E.`
                      : ""}
                    {" "}
                    Min/max = extrêmes des 24 heures UTC de température à 2 m, pas le Tmin/Tmax d’abri.
                    {data.era5.dewpointMin != null || data.era5.dewpointMax != null
                      ? ` Point de rosée à 2 m (même maille, pas une mesure) : ${data.era5.dewpointMinDisplay} / ${data.era5.dewpointMaxDisplay}.`
                      : ""}
                    {data.era5.precipMm != null
                      ? ` Pluie sommée sur 24 h UTC (estimation, pas un pluviomètre) : ${data.era5.precipDisplay}.`
                      : ""}
                    {data.era5.precipDelta != null && data.observation?.precipDisplay
                      ? ` Mesure de station : ${data.observation.precipDisplay}. Écart estimation − mesure : ${formatSignedMm(data.era5.precipDelta)}. Pas une fusion.`
                      : ""}
                    {data.era5.windSpeedMs != null
                      ? ` Vent à 10 m (moyenne des vitesses horaires, dérivé de u et v, pas un anémomètre) : ${data.era5.windSpeedDisplay}${data.era5.windFromDeg != null ? `, d’où il vient ${data.era5.windFromDisplay}` : ""}.`
                      : ""}
                    {data.era5.mslHpa != null
                      ? ` Pression au niveau de la mer (moyenne 24 h UTC) : ${data.era5.mslDisplay}. Ce n’est pas la pression au sol de ${data.place.name}.`
                      : ""}
                    {data.era5.spHpa != null
                      ? ` Pression à la surface du modèle (moyenne 24 h UTC) : ${data.era5.spDisplay}${
                          data.era5.modelSurfaceAltitudeM != null
                            ? ` (altitude de cette maille : ${data.era5.modelSurfaceAltitudeM} m)`
                            : ""
                        }. Ce n’est pas la pression au sol de ${data.place.name}${
                          data.place.altitude_m != null ? ` (${data.place.altitude_m} m)` : ""
                        }.`
                      : ""}
                    {data.era5.snowSweMm != null
                      ? ` Équivalent en eau de la neige du modèle (moyenne 24 h, pas une hauteur de manteau en ville) : ${data.era5.snowSweDisplay}.`
                      : ""}
                    {data.era5.ssrdMj != null
                      ? ` Rayonnement solaire descendant (somme 24 h UTC, pas un pyranomètre) : ${data.era5.ssrdDisplay}.`
                      : ""}
                    {data.era5.gustMs != null
                      ? ` Rafale instantanée maximale à 10 m (pas une rafale officielle) : ${data.era5.gustDisplay}.`
                      : ""}
                    {" "}
                    Maille d’environ 0,25°. Aucune correction d’altitude ni moyenne avec la station.
                    {(ERA5_POINT_DATES as readonly string[]).includes(date)
                      ? ` Le point Grenoble est importé pour ${ERA5_POINT_DATES.length} jours (12 mai 1982 et 1986, 11–13 mai 1983), même maille. Pas une série 1940–2026.`
                      : ""}
                    {(ERA5_FRANCE_DAILY_2T_DATES as readonly string[]).includes(date)
                      ? ` Un quotidien 2t bbox France existe pour ${ERA5_FRANCE_DAILY_2T_DATES.length} jours (11–13 mai 1983), ${ERA5_FRANCE_DAILY_2T_CELLS} mailles, JSON hors base. Pas l’archive 1940–2026.`
                      : ""}
                  </p>
                  {data.attributions.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </details>
              </>
            ) : (
              <p className="yearlyNote">
                Aucune estimation climatique n’est inventée pour cette date. Une comparaison pourra apparaître
                après extraction d’un point réel, sans fusion avec la mesure officielle.
              </p>
            )}
          </section>

          <section id="ce-jour" className="panel chartPanel">
            <div className="panelTitle">
              <div>
                <span>CE JOUR DANS L’HISTOIRE</span>
                <h2>
                  Tous les {date.slice(8, 10)}/{date.slice(5, 7)} observés
                </h2>
              </div>
              {data.sameDayContext ? (
                <strong>n={data.sameDayContext.n} année{data.sameDayContext.n > 1 ? "s" : ""}</strong>
              ) : data.recordsObserved ? (
                <strong>n={data.recordsObserved.yearsOnThisDay} années</strong>
              ) : null}
            </div>
            {data.sameDayContext?.label ? <p className="sameDayStory">{data.sameDayContext.label}</p> : null}
            {data.sameDayContext ? (
              <div className="metricRow sameDayMetrics">
                <div>
                  <span>Maximale moyenne</span>
                  <strong>{formatCelsius(data.sameDayContext.tmaxMean)}</strong>
                </div>
                <div>
                  <span>Minimale moyenne</span>
                  <strong>{formatCelsius(data.sameDayContext.tminMean)}</strong>
                </div>
                <div>
                  <span>Plus chaude que</span>
                  <strong>
                    {data.sameDayContext.tmaxPercentile != null
                      ? `${data.sameDayContext.tmaxPercentile} %`
                      : "non disponible"}
                  </strong>
                </div>
              </div>
            ) : null}
            {data.recordsObserved && (
              <p className="recordLine">
                Record de froid {data.recordsObserved.recordTmin ?? "—"} °C ({data.recordsObserved.recordTminDate || "—"}) ·
                Record de chaleur {data.recordsObserved.recordTmax ?? "—"} °C ({data.recordsObserved.recordTmaxDate || "—"})
              </p>
            )}
            <YearHeatmap
              series={data.seriesSameDay}
              selected={date}
              hrefFor={(iso) => communeHistoryHref(pathname, iso, histoire ? "naissance" : undefined)}
            />
            {chart.length ? (
              <ClimateLineChart
                data={chart}
                xKey="year"
                lines={[
                  { dataKey: "tmax", stroke: "#ff7b36", name: "Maximale" },
                  { dataKey: "tmin", stroke: "#7ec8ff", name: "Minimale" }
                ]}
              />
            ) : (
              <p className="yearlyNote">Aucun {date.slice(8, 10)}/{date.slice(5, 7)} observé à cette station. Rien n’est inventé.</p>
            )}
            <details className="techDetails">
              <summary>En savoir plus</summary>
              <p>
                Moyennes et percentile calculés seulement s’il y a au moins 5 {date.slice(8, 10)}/{date.slice(5, 7)} avec
                une mesure. Une année sans Tmin ou Tmax n’entre pas dans la moyenne correspondante (pas un 0). Ce n’est
                pas une normale climatique. Station du jour : {data.preferredStation?.name}.
              </p>
            </details>
          </section>
          </div>
      ) : null}

      {yearly || place ? (
          <div className="placeClimateFlow">
          <section className="panel chartPanel">
            <div className="panelTitle">
              <div>
                <span>ÉVOLUTION ANNUELLE</span>
                <h2>Les années suffisamment observées</h2>
              </div>
              {yearly?.station ? (
                <strong>
                  {yearly.station.completeYears} année{yearly.station.completeYears > 1 ? "s" : ""} complète
                  {yearly.station.completeYears > 1 ? "s" : ""}
                </strong>
              ) : null}
            </div>
            {yearly?.disclaimer ? <p className="stationDisclaimer">{yearly.disclaimer}</p> : null}
            <p className="yearlyNote">
              Seules les années avec au moins {yearly?.completeDayThreshold ?? 330} jours de Tmin et Tmax connus sont
              tracées. Une année incomplète n’est pas une année climatique. La pluie annuelle n’apparaît que si presque
              tous les jours ont une mesure : un trou n’est pas zéro.
            </p>
            {!yearly ? (
              <p className="note">Chargement du climat observé…</p>
            ) : !yearly.computed ? (
              <p className="note">Statistiques non calculées. Une visite de page ne lance pas ce calcul.</p>
            ) : yearlyChart.length === 0 ? (
              <p className="note">Pas assez d’années complètes pour tracer une évolution.</p>
            ) : (
              <ClimateLineChart
                data={yearlyChart}
                xKey="year"
                lines={[
                  { dataKey: "tmax", stroke: "#ff7b36", name: "Maximale moyenne" },
                  { dataKey: "tmin", stroke: "#7ec8ff", name: "Minimale moyenne" }
                ]}
                referenceLines={
                  yearly.normal?.available && yearly.normal.sameStation && yearly.normal.tmaxMean != null
                    ? [{ y: yearly.normal.tmaxMean, label: `Normale max. ${yearly.normal.period}` }]
                    : undefined
                }
              />
            )}
            {yearly?.years.some((row) => row.yearComplete && row.precipComplete) ? (
              <p className="recordLine">
                Dernière année complète avec pluie connue :{" "}
                {(() => {
                  const last = [...yearly.years].reverse().find((row) => row.yearComplete && row.precipComplete);
                  return last
                    ? `${last.year} · ${last.amplitude != null ? `${formatMeanAmplitudeC(last.amplitude)} · ` : ""}${last.precipitationSum ?? "non disponible"} mm${last.daysRain != null ? ` · ${last.daysRain} jour${last.daysRain > 1 ? "s" : ""} de pluie` : ""} · ${last.daysGe25 != null ? `${last.daysGe25} jour${last.daysGe25 > 1 ? "s" : ""} ≥ 25 °C · ` : ""}${last.daysGe30} jour${last.daysGe30 > 1 ? "s" : ""} ≥ 30 °C${last.daysGe35 != null ? ` · ${last.daysGe35} jour${last.daysGe35 > 1 ? "s" : ""} ≥ 35 °C` : ""}${last.daysGe40 != null ? ` · ${last.daysGe40} jour${last.daysGe40 > 1 ? "s" : ""} ≥ 40 °C` : ""}${last.daysFrost != null ? ` · ${last.daysFrost} jour${last.daysFrost > 1 ? "s" : ""} de gel` : ""}${last.tropicalNights != null ? ` · ${last.tropicalNights} nuit${last.tropicalNights > 1 ? "s" : ""} tropicale${last.tropicalNights > 1 ? "s" : ""}` : ""}`
                    : "non disponible";
                })()}
              </p>
            ) : null}
          </section>

          {yearly?.warming ? (
            <section id="rechauffement" className="panel chartPanel">
              <div className="panelTitle">
                <div>
                  <span>MA VILLE SE RÉCHAUFFE-T-ELLE ?</span>
                  <h2>Un seul poste, années climatiques seulement</h2>
                </div>
                {yearly.station ? <strong>{yearly.station.name}</strong> : null}
              </div>
              <p className="yearlyNote">{yearly.warming.methodNote}</p>
              {!yearly.warming.linear.available ? (
                <p className="yearlyNote">{yearly.warming.linear.reason}</p>
              ) : (
                <>
                  <p className="yearlyNote">
                    Pente sur {yearly.warming.linear.n} années climatiques de {yearly.warming.linear.from} à{" "}
                    {yearly.warming.linear.to}
                    {yearly.warming.linear.shortSeries
                      ? " — moins de 30 ans : ce n’est pas une climatologie classique, la pente peut encore bouger."
                      : "."}{" "}
                    {yearly.normal?.available && yearly.normal.sameStation
                      ? `Normale ${yearly.normal.period} de ce poste : max. ${formatCelsius(yearly.normal.tmaxMean)}.`
                      : "Pas de normale 1991-2020 appliquée ici : il faut 24 années climatiques de ce même poste sur la période."}
                  </p>
                  <div className="compareMetrics warmingMetrics">
                    <div>
                      <span>Maximale</span>
                      <strong>{formatSignedPerDecade(yearly.warming.linear.tmaxPerDecade, "°C")}</strong>
                    </div>
                    <div>
                      <span>Minimale</span>
                      <strong>{formatSignedPerDecade(yearly.warming.linear.tminPerDecade, "°C")}</strong>
                    </div>
                    <div>
                      <span>Jours ≥ 30 °C</span>
                      <strong>{formatSignedPerDecade(yearly.warming.linear.daysGe30PerDecade, "j")}</strong>
                    </div>
                    <div>
                      <span>Jours de gel</span>
                      <strong>{formatSignedPerDecade(yearly.warming.linear.frostPerDecade, "j")}</strong>
                    </div>
                    <div>
                      <span>Nuits tropicales</span>
                      <strong>{formatSignedPerDecade(yearly.warming.linear.tropicalNightsPerDecade, "j")}</strong>
                    </div>
                  </div>
                </>
              )}
              {!yearly.warming.windows.comparable ? (
                <p className="yearlyNote">{yearly.warming.windows.reason}</p>
              ) : (
                <>
                  <p className="yearlyNote">
                    Les {yearly.warming.windows.early.n} premières années climatiques (
                    {yearly.warming.windows.early.from}–{yearly.warming.windows.early.to}) vs les{" "}
                    {yearly.warming.windows.late.n} dernières ({yearly.warming.windows.late.from}–
                    {yearly.warming.windows.late.to}), sans chevauchement. Écart = fin − début.
                  </p>
                  <div className="compareMetrics warmingMetrics">
                    <div>
                      <span>Maximale moyenne</span>
                      <strong>
                        {formatCelsius(yearly.warming.windows.early.tmaxMean)} →{" "}
                        {formatCelsius(yearly.warming.windows.late.tmaxMean)}
                      </strong>
                      <small>{formatSignedCelsius(yearly.warming.windows.tmaxDelta)}</small>
                    </div>
                    <div>
                      <span>Minimale moyenne</span>
                      <strong>
                        {formatCelsius(yearly.warming.windows.early.tminMean)} →{" "}
                        {formatCelsius(yearly.warming.windows.late.tminMean)}
                      </strong>
                      <small>{formatSignedCelsius(yearly.warming.windows.tminDelta)}</small>
                    </div>
                    <div>
                      <span>Jours ≥ 30 °C</span>
                      <strong>
                        {yearly.warming.windows.early.daysGe30Mean ?? "non disponible"} →{" "}
                        {yearly.warming.windows.late.daysGe30Mean ?? "non disponible"}
                      </strong>
                      <small>
                        {yearly.warming.windows.daysGe30Delta == null
                          ? "non disponible"
                          : `${yearly.warming.windows.daysGe30Delta > 0 ? "+" : ""}${yearly.warming.windows.daysGe30Delta} j`}
                      </small>
                    </div>
                    <div>
                      <span>Jours de gel</span>
                      <strong>
                        {yearly.warming.windows.early.frostMean ?? "non disponible"} →{" "}
                        {yearly.warming.windows.late.frostMean ?? "non disponible"}
                      </strong>
                      <small>
                        {yearly.warming.windows.frostDelta == null
                          ? "non disponible"
                          : `${yearly.warming.windows.frostDelta > 0 ? "+" : ""}${yearly.warming.windows.frostDelta} j`}
                      </small>
                    </div>
                    <div>
                      <span>Nuits tropicales</span>
                      <strong>
                        {yearly.warming.windows.early.tropicalNightsMean ?? "non disponible"} →{" "}
                        {yearly.warming.windows.late.tropicalNightsMean ?? "non disponible"}
                      </strong>
                      <small>
                        {yearly.warming.windows.tropicalNightsDelta == null
                          ? "non disponible"
                          : `${yearly.warming.windows.tropicalNightsDelta > 0 ? "+" : ""}${yearly.warming.windows.tropicalNightsDelta} j`}
                      </small>
                    </div>
                  </div>
                </>
              )}
              <details className="moreMethod">
                <summary>En savoir plus</summary>
                <p>
                  Méthode {yearly.warming.method} : moindres carrés ordinaires, années avec au moins{" "}
                  {yearly.completeDayThreshold} jours de Tmin et Tmax. Homogénéisation :{" "}
                  {yearly.warming.homogenized ? "oui" : "non"}. Gel = jours à Tmin &lt; 0 °C. Nuit tropicale = Tmin ≥
                  20 °C. Compteurs d’une année complète seulement — un trou n’est pas zéro.
                </p>
              </details>
            </section>
          ) : null}

          {yearly?.computed && yearly.normal ? (
            <section className="panel chartPanel">
              <div className="panelTitle">
                <div>
                  <span>NORMALE {yearly.normal.period}</span>
                  <h2>
                    {yearly.normal.available
                      ? yearly.normal.sameStation
                        ? "Même station que la série annuelle"
                        : "Autre station — pas d’anomalie sur le graphique"
                      : "Pas assez d’années climatiques"}
                  </h2>
                </div>
                {yearly.normal.available && yearly.normal.station ? (
                  <strong>
                    {yearly.normal.station.name}
                    {yearly.normal.station.distanceKm != null ? ` · ${yearly.normal.station.distanceKm} km` : ""}
                  </strong>
                ) : null}
              </div>
              {yearly.normal.reason ? <p className="yearlyNote">{yearly.normal.reason}</p> : (
                <p className="yearlyNote">
                  Moyenne des années climatiques complètes de {yearly.normal.period} ({yearly.normal.yearsUsed} ans,
                  seuil {yearly.normal.minYearsRequired}). Anomalie = année − cette normale, même poste, même
                  variable. Série brute, pas une normale homogénéisée. Ce n’est pas une étude certifiée.
                </p>
              )}
              {yearly.normal.available ? (
                <div className="compareMetrics">
                  <div>
                    <span>Maximale</span>
                    <strong>{formatCelsius(yearly.normal.tmaxMean)}</strong>
                  </div>
                  <div>
                    <span>Minimale</span>
                    <strong>{formatCelsius(yearly.normal.tminMean)}</strong>
                  </div>
                  <div>
                    <span>Pluie annuelle moyenne</span>
                    <strong>
                      {yearly.normal.precipAvailable ? formatMm(yearly.normal.precipitationMean) : "non disponible"}
                    </strong>
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}

          {yearly?.yearRecords && yearly.yearRecords.yearsUsed > 0 ? (
            <section className="panel chartPanel">
              <div className="panelTitle">
                <div>
                  <span>RECORDS D’ANNÉE OBSERVÉS</span>
                  <h2>
                    {yearly.yearRecords.periodFrom}–{yearly.yearRecords.periodTo} · {yearly.station?.name}
                  </h2>
                </div>
                <strong>{yearly.yearRecords.yearsUsed} années climatiques</strong>
              </div>
              <p className="yearlyNote">
                Parmi les années assez observées de cette station seulement. Ce n’est pas un maximum ERA5, ni le
                record de la commune, ni une série homogénéisée.
              </p>
              <div className="compareMetrics">
                <div>
                  <span>Année la plus chaude</span>
                  <strong>
                    {yearly.yearRecords.hottest
                      ? `${yearly.yearRecords.hottest.year} · ${formatCelsius(yearly.yearRecords.hottest.value)}`
                      : "non disponible"}
                  </strong>
                  <small>maximale annuelle moyenne</small>
                </div>
                <div>
                  <span>Année la plus froide</span>
                  <strong>
                    {yearly.yearRecords.coldest
                      ? `${yearly.yearRecords.coldest.year} · ${formatCelsius(yearly.yearRecords.coldest.value)}`
                      : "non disponible"}
                  </strong>
                  <small>minimale annuelle moyenne</small>
                </div>
                <div>
                  <span>Année la plus arrosée</span>
                  <strong>
                    {yearly.yearRecords.wettest
                      ? `${yearly.yearRecords.wettest.year} · ${formatMm(yearly.yearRecords.wettest.value)}`
                      : "non disponible"}
                  </strong>
                  <small>pluie annuelle complète seulement</small>
                </div>
                <div>
                  <span>Plus de jours ≥ 30 °C</span>
                  <strong>
                    {yearly.yearRecords.mostDaysGe30
                      ? `${yearly.yearRecords.mostDaysGe30.year} · ${formatDaysGe30(yearly.yearRecords.mostDaysGe30.value)}`
                      : "non disponible"}
                  </strong>
                  <small>Tmax ≥ 30 °C, années climatiques seulement</small>
                </div>
                <div>
                  <span>Plus de jours de gel</span>
                  <strong>
                    {yearly.yearRecords.mostFrost
                      ? `${yearly.yearRecords.mostFrost.year} · ${formatDaysFrost(yearly.yearRecords.mostFrost.value)}`
                      : "non disponible"}
                  </strong>
                  <small>Tmin &lt; 0 °C, années climatiques seulement</small>
                </div>
                <div>
                  <span>Plus de nuits tropicales</span>
                  <strong>
                    {yearly.yearRecords.mostTropicalNights
                      ? `${yearly.yearRecords.mostTropicalNights.year} · ${formatTropicalNights(yearly.yearRecords.mostTropicalNights.value)}`
                      : "non disponible"}
                  </strong>
                  <small>Tmin ≥ 20 °C, années climatiques seulement</small>
                </div>
              </div>
              {data?.place?.insee_code || yearly?.commune?.insee ? (
                <p className="note">
                  <Link href={`/comparer?a=${data?.place?.insee_code || yearly?.commune?.insee}`}>
                    Comparer avec une autre commune
                  </Link>
                </p>
              ) : null}
            </section>
          ) : null}

          {completeYears.length >= 2 ? (
            <section className="panel chartPanel">
              <div className="panelTitle">
                <div>
                  <span>COMPARER DEUX ANNÉES</span>
                  <h2>Même station, années complètes seulement</h2>
                </div>
              </div>
              <p className="yearlyNote">
                Écart = année B − année A, sur la station climatique ci-dessus. Une année trouée n’entre pas dans la
                liste. Ce n’est pas une étude certifiée.
              </p>
              <div className="compareRow">
                <label>
                  <span>Année A</span>
                  <select
                    value={yearA ?? ""}
                    onChange={(e) => setYearA(Number(e.target.value))}
                  >
                    {completeYears.map((row) => (
                      <option key={row.year} value={row.year}>
                        {row.year}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Année B</span>
                  <select
                    value={yearB ?? ""}
                    onChange={(e) => setYearB(Number(e.target.value))}
                  >
                    {completeYears.map((row) => (
                      <option key={row.year} value={row.year}>
                        {row.year}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {yearCompare && !yearCompare.comparable ? (
                <p className="note">{yearCompare.reason}</p>
              ) : yearCompare && yearA != null && yearB != null ? (
                <>
                  <div className="compareMetrics">
                    <div>
                      <span>Maximale moyenne</span>
                      <strong>
                        {formatCelsius(yearly?.years.find((row) => row.year === yearA)?.tmaxMean)} →{" "}
                        {formatCelsius(yearly?.years.find((row) => row.year === yearB)?.tmaxMean)}
                      </strong>
                      <small>{formatSignedCelsius(yearCompare.tmaxDelta)}</small>
                    </div>
                    <div>
                      <span>Minimale moyenne</span>
                      <strong>
                        {formatCelsius(yearly?.years.find((row) => row.year === yearA)?.tminMean)} →{" "}
                        {formatCelsius(yearly?.years.find((row) => row.year === yearB)?.tminMean)}
                      </strong>
                      <small>{formatSignedCelsius(yearCompare.tminDelta)}</small>
                    </div>
                    <div>
                      <span>Jours ≥ 30 °C</span>
                      <strong>
                        {yearly?.years.find((row) => row.year === yearA)?.daysGe30 ?? "—"} →{" "}
                        {yearly?.years.find((row) => row.year === yearB)?.daysGe30 ?? "—"}
                      </strong>
                      <small>
                        {yearCompare.daysGe30Delta > 0 ? "+" : ""}
                        {yearCompare.daysGe30Delta} jour{Math.abs(yearCompare.daysGe30Delta) > 1 ? "s" : ""}
                      </small>
                    </div>
                    <div>
                      <span>Pluie annuelle</span>
                      <strong>
                        {formatMm(yearly?.years.find((row) => row.year === yearA)?.precipitationSum)} →{" "}
                        {formatMm(yearly?.years.find((row) => row.year === yearB)?.precipitationSum)}
                      </strong>
                      <small>{formatSignedMm(yearCompare.precipDelta)}</small>
                    </div>
                  </div>
                  {yearly?.normal?.available && yearly.normal.sameStation ? (
                    <p className="recordLine">
                      Anomalie de max. vs {yearly.normal.period} :{" "}
                      {formatSignedCelsius(yearly.years.find((row) => row.year === yearA)?.tmaxAnomaly ?? null)} →{" "}
                      {formatSignedCelsius(yearly.years.find((row) => row.year === yearB)?.tmaxAnomaly ?? null)}
                    </p>
                  ) : null}
                </>
              ) : null}
            </section>
          ) : null}

          <section id="mois" className="panel chartPanel">
            <div className="panelTitle">
              <div>
                <span>LES MOIS</span>
                <h2>Assez observés, un seul poste</h2>
              </div>
              {yearly?.monthRecords?.hottest ? (
                <strong>
                  Plus chaud : {formatMonthYear(yearly.monthRecords.hottest.year, yearly.monthRecords.hottest.month)} ·{" "}
                  {formatCelsius(yearly.monthRecords.hottest.value)}
                </strong>
              ) : null}
            </div>
            <p className="yearlyNote">
              Un mois d’une année est affiché s’il a au moins {yearly?.completeMonthDayThreshold ?? 25} jours de Tmin et
              Tmax connus. Un mois troué n’est pas une climatologie : la pluie n’est pas zéro. Ce n’est pas le record de
              la commune.
            </p>
            {yearly?.monthRecords && (yearly.monthRecords.hottest || yearly.monthRecords.coldest || yearly.monthRecords.wettest) ? (
              <div className="compareMetrics">
                <div>
                  <span>Mois le plus chaud</span>
                  <strong>
                    {yearly.monthRecords.hottest
                      ? `${formatMonthYear(yearly.monthRecords.hottest.year, yearly.monthRecords.hottest.month)} · ${formatCelsius(yearly.monthRecords.hottest.value)}`
                      : "non disponible"}
                  </strong>
                  <small>maximale mensuelle moyenne</small>
                </div>
                <div>
                  <span>Mois le plus froid</span>
                  <strong>
                    {yearly.monthRecords.coldest
                      ? `${formatMonthYear(yearly.monthRecords.coldest.year, yearly.monthRecords.coldest.month)} · ${formatCelsius(yearly.monthRecords.coldest.value)}`
                      : "non disponible"}
                  </strong>
                  <small>minimale mensuelle moyenne</small>
                </div>
                <div>
                  <span>Mois le plus arrosé</span>
                  <strong>
                    {yearly.monthRecords.wettest
                      ? `${formatMonthYear(yearly.monthRecords.wettest.year, yearly.monthRecords.wettest.month)} · ${formatMm(yearly.monthRecords.wettest.value)}`
                      : "non disponible"}
                  </strong>
                  <small>pluie d’un mois complet seulement</small>
                </div>
              </div>
            ) : null}
            {!yearly || climateDetailsPending(yearly) ? (
              <p className="note">Chargement du climat observé…</p>
            ) : (monthYearsFull.length || monthYearsAny.length) ? (
              <>
                <div className="compareRow">
                  <label>
                    <span>Année</span>
                    <select
                      value={monthYear ?? ""}
                      onChange={(e) => setMonthYear(Number(e.target.value))}
                    >
                      {(monthYearsFull.length ? monthYearsFull : monthYearsAny).map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                {monthChart.length ? (
                  <ClimateLineChart
                    data={monthChart}
                    xKey="label"
                    lines={[
                      { dataKey: "tmax", stroke: "#ff7b36", name: "Maximale moyenne" },
                      { dataKey: "tmin", stroke: "#7ec8ff", name: "Minimale moyenne" },
                      ...(yearly?.monthNormal?.available && yearly.monthNormal.sameStation
                        ? [
                            {
                              dataKey: "normalTmax",
                              stroke: "#ff7b36",
                              name: `Normale max. ${yearly.monthNormal.period}`,
                              dashed: true
                            },
                            {
                              dataKey: "normalTmin",
                              stroke: "#7ec8ff",
                              name: `Normale min. ${yearly.monthNormal.period}`,
                              dashed: true
                            }
                          ]
                        : [])
                    ]}
                  />
                ) : null}
              </>
            ) : (
              <p className="note">Pas assez de mois complets pour tracer une année.</p>
            )}
            {yearly?.monthNormal ? (
              <div id="normale-mensuelle" className="monthNormalBlock">
                <h3 className="subh">Normale mensuelle {yearly.monthNormal.period}</h3>
                {yearly.monthNormal.reason ? <p className="yearlyNote">{yearly.monthNormal.reason}</p> : (
                  <p className="yearlyNote">
                    Moyenne des mois complets {yearly.monthNormal.period} sur {yearly.monthNormal.station?.name}
                    {yearly.monthNormal.station?.distanceKm != null ? ` (${yearly.monthNormal.station.distanceKm} km)` : ""}
                    , au moins {yearly.monthNormal.minYearsRequired} mois de chaque calendrier. Série brute, pas une
                    normale homogénéisée. Méthode {yearly.monthNormal.methodVersion}.
                  </p>
                )}
                {yearly.monthNormal.available && monthNormalChart.length ? (
                  <>
                    <ClimateLineChart
                      data={monthNormalChart}
                      xKey="label"
                      lines={[
                        { dataKey: "tmax", stroke: "#ff7b36", name: "Maximale normale" },
                        { dataKey: "tmin", stroke: "#7ec8ff", name: "Minimale normale" }
                      ]}
                    />
                    <div className="compareMetrics monthNormalMetrics">
                      {yearly.monthNormal.months.filter((row) => row.month === 1 || row.month === 7).map((row) => (
                        <div key={row.month}>
                          <span>{monthNameFr(row.month)}</span>
                          <strong>
                            {formatCelsius(row.tminMean)} / {formatCelsius(row.tmaxMean)}
                          </strong>
                          <small>
                            {row.precipAvailable ? formatMm(row.precipitationMean) : "pluie non disponible"} · n=
                            {row.yearsUsed}
                          </small>
                        </div>
                      ))}
                    </div>
                    <details className="techDetails">
                      <summary>En savoir plus</summary>
                      <p>
                        Chaque mois est la moyenne des mois complets (≥ 25 jours de Tmin et Tmax) de{" "}
                        {yearly.monthNormal.period}. Un mois incomplet n’entre pas. La pluie n’est moyennée que s’il y
                        a au moins {yearly.monthNormal.minYearsRequired} mois à précipitation complète. Pas d’ERA5.
                        {yearly.monthNormal.sameStation
                          ? " Même poste que la série annuelle : les pointillés du graphique d’année sont cette normale."
                          : " Autre poste que la série annuelle : aucune anomalie mensuelle n’est calculée."}
                      </p>
                    </details>
                  </>
                ) : null}
              </div>
            ) : null}
            {completeMonthPairs.length >= 2 ? (
              <>
                <p className="yearlyNote">
                  Même mois, deux années. Écart = année B − année A, sur {yearly?.station?.name}.
                </p>
                <div className="compareRow">
                  <label>
                    <span>Mois</span>
                    <select value={monthKind} onChange={(e) => setMonthKind(Number(e.target.value))}>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                        <option key={month} value={month}>
                          {monthNameFr(month)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Année A</span>
                    <select
                      value={monthYearA ?? ""}
                      onChange={(e) => setMonthYearA(Number(e.target.value))}
                    >
                      {completeMonthPairs.map((row) => (
                        <option key={row.year} value={row.year}>
                          {row.year}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Année B</span>
                    <select
                      value={monthYearB ?? ""}
                      onChange={(e) => setMonthYearB(Number(e.target.value))}
                    >
                      {completeMonthPairs.map((row) => (
                        <option key={row.year} value={row.year}>
                          {row.year}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                {monthCompare && !monthCompare.comparable ? (
                  <p className="note">{monthCompare.reason}</p>
                ) : monthCompare && monthCompare.comparable ? (
                  <p className="recordLine">
                    Maximale moyenne {formatSignedCelsius(monthCompare.tmaxDelta)} · jours ≥ 30 °C{" "}
                    {monthCompare.daysGe30Delta > 0 ? "+" : ""}
                    {monthCompare.daysGe30Delta} · pluie {formatSignedMm(monthCompare.precipDelta)}
                  </p>
                ) : null}
              </>
            ) : null}
          </section>

          <section id="saisons" className="panel chartPanel">
            <div className="panelTitle">
              <div>
                <span>{seasonCopy.eyebrow}</span>
                <h2>{seasonCopy.title}</h2>
              </div>
              {seasonRecord ? (
                <strong>
                  {seasonCopy.recordKind === "coldest" ? "Plus froid" : "Plus chaud"} : {seasonRecord.year} ·{" "}
                  {formatCelsius(seasonCopy.recordKind === "coldest" ? seasonRecord.tminMean : seasonRecord.tmaxMean)}
                </strong>
              ) : null}
            </div>
            <p className="yearlyNote">
              {seasonCopy.months} Une saison est tracée s’il y a au moins {yearly?.completeSeasonDayThreshold ?? 75}{" "}
              jours de Tmin et Tmax connus. La pluie d’une saison trouée n’est pas zéro. On ne compare pas un hiver à
              un été. Ce n’est pas le record de la commune, seulement de cette station.
            </p>
            <div className="compareRow">
              <label>
                <span>Saison</span>
                <select
                  value={seasonKind}
                  onChange={(e) => setSeasonKind(e.target.value as SeasonCode)}
                >
                  {SEASON_CODES.map((code) => (
                    <option key={code} value={code}>
                      {seasonSelectLabel(code)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {!yearly ? (
              <p className="note">Chargement du climat observé…</p>
            ) : !yearly.computed ? (
              <p className="note">Statistiques non calculées. Une visite de page ne lance pas ce calcul.</p>
            ) : climateDetailsPending(yearly) ? (
              <p className="note">Chargement du climat observé…</p>
            ) : seasonChart.length === 0 ? (
              <p className="note">Pas assez de saisons complètes pour tracer une évolution.</p>
            ) : (
              <ClimateLineChart
                data={seasonChart}
                xKey="year"
                lines={[
                  { dataKey: "tmax", stroke: "#ff7b36", name: "Maximale moyenne" },
                  { dataKey: "tmin", stroke: "#7ec8ff", name: "Minimale moyenne" }
                ]}
              />
            )}
            {completeSeasons.length >= 2 ? (
              <>
                <div className="compareRow">
                  <label>
                    <span>{seasonSelectLabel(seasonKind)} A</span>
                    <select
                      value={seasonYearA ?? ""}
                      onChange={(e) => setSeasonYearA(Number(e.target.value))}
                    >
                      {completeSeasons.map((row) => (
                        <option key={row.year} value={row.year}>
                          {row.year}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>{seasonSelectLabel(seasonKind)} B</span>
                    <select
                      value={seasonYearB ?? ""}
                      onChange={(e) => setSeasonYearB(Number(e.target.value))}
                    >
                      {completeSeasons.map((row) => (
                        <option key={row.year} value={row.year}>
                          {row.year}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                {seasonCompare && !seasonCompare.comparable ? (
                  <p className="note">{seasonCompare.reason}</p>
                ) : seasonCompare && seasonCompare.comparable ? (
                  <p className="recordLine">
                    {seasonCopy.recordKind === "coldest" ? "Minimale" : "Maximale"} moyenne{" "}
                    {formatSignedCelsius(
                      seasonCopy.recordKind === "coldest" ? seasonCompare.tminDelta : seasonCompare.tmaxDelta
                    )}{" "}
                    · jours ≥ 30 °C {seasonCompare.daysGe30Delta > 0 ? "+" : ""}
                    {seasonCompare.daysGe30Delta} · pluie {formatSignedMm(seasonCompare.precipDelta)}
                  </p>
                ) : null}
              </>
            ) : null}
          </section>

          <section id="chaleur" className="panel chartPanel">
            <div className="panelTitle">
              <div>
                <span>LES FORTES CHALEURS</span>
                <h2>Jours consécutifs, un seul poste</h2>
              </div>
              {heatBand30?.longest ? (
                <strong>
                  Plus long ≥ 30 °C : {heatBand30.longest.durationDays} j · {heatBand30.longest.startDate} →{" "}
                  {heatBand30.longest.endDate}
                </strong>
              ) : null}
            </div>
            <p className="yearlyNote">
              Au moins {yearly?.heat?.minDays ?? 3} jours calendaires d’affilée avec une maximale mesurée ≥ le seuil,
              sur {yearly?.station?.name ?? "ce poste"}. Un trou n’est pas un jour chaud.{" "}
              <strong>Ce n’est pas une canicule officielle</strong> Météo-France (seuils départementaux de Tmin et
              Tmax).
            </p>
            {!yearly ? (
              <p className="note">Chargement du climat observé…</p>
            ) : !yearly.computed ? (
              <p className="note">Statistiques non calculées. Une visite de page ne lance pas ce calcul.</p>
            ) : climateDetailsPending(yearly) ? (
              <p className="note">Chargement du climat observé…</p>
            ) : !heatBand30 || heatBand30.episodeCount === 0 ? (
              <p className="note">Aucun épisode de 3 jours consécutifs à Tmax ≥ 30 °C sur ce poste.</p>
            ) : (
              <>
                <div className="compareMetrics heatMetrics">
                  <div>
                    <span>Plus long ≥ 30 °C</span>
                    <strong>{heatBand30.longest ? `${heatBand30.longest.durationDays} jours` : "aucun"}</strong>
                    <small>{heatEpisodeRange(heatBand30.longest)}</small>
                  </div>
                  <div>
                    <span>Plus chaud ≥ 30 °C</span>
                    <strong>{heatBand30.hottest ? formatCelsius(heatBand30.hottest.tmaxMean) : "aucun"}</strong>
                    <small>
                      {heatEpisodeRange(heatBand30.hottest)}
                      {heatBand30.hottest ? ` · pic ${formatCelsius(heatBand30.hottest.tmaxMax)}` : ""}
                    </small>
                  </div>
                  <div>
                    <span>Épisodes ≥ 30 °C</span>
                    <strong>{heatBand30.episodeCount}</strong>
                    <small>{heatBand30.totalDays} jours concernés</small>
                  </div>
                  <div>
                    <span>Plus long ≥ 35 °C</span>
                    <strong>
                      {heatBand35?.longest ? `${heatBand35.longest.durationDays} jours` : "aucun"}
                    </strong>
                    <small>
                      {heatBand35?.episodeCount
                        ? `${heatBand35.episodeCount} épisode${heatBand35.episodeCount > 1 ? "s" : ""}`
                        : "pas 3 jours d’affilée"}
                    </small>
                  </div>
                  <div>
                    <span>Plus long ≥ 40 °C</span>
                    <strong>
                      {heatBand40?.longest ? `${heatBand40.longest.durationDays} jours` : "aucun"}
                    </strong>
                    <small>
                      {heatBand40?.episodeCount
                        ? `${heatBand40.episodeCount} épisode${heatBand40.episodeCount > 1 ? "s" : ""}`
                        : "pas 3 jours d’affilée"}
                    </small>
                  </div>
                </div>
                {heatBand30.longestList.length ? (
                  <table>
                    <thead>
                      <tr>
                        <th>Début</th>
                        <th>Fin</th>
                        <th>Durée</th>
                        <th>Max. moy.</th>
                        <th>Pic</th>
                      </tr>
                    </thead>
                    <tbody>
                      {heatBand30.longestList.map((episode) => (
                        <tr key={`${episode.startDate}-${episode.endDate}`}>
                          <td>{episode.startDate}</td>
                          <td>{episode.endDate}</td>
                          <td>{episode.durationDays} j</td>
                          <td>{formatCelsius(episode.tmaxMean)}</td>
                          <td>{formatCelsius(episode.tmaxMax)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : null}
              </>
            )}
            {yearly?.heat ? (
              <details className="moreMethod">
                <summary>En savoir plus</summary>
                <p>
                  Méthode {yearly.heat.method}. {yearly.heat.methodNote} Canicule officielle :{" "}
                  {yearly.heat.officialHeatwave ? "oui" : "non"}.
                </p>
              </details>
            ) : null}
          </section>

          {histoire && childhood ? (
            <section className="panel chartPanel">
              <div className="panelTitle">
                <div>
                  <span>QUAND J’ÉTAIS ENFANT</span>
                  <h2>Moyenne des années climatiques, sans chevauchement</h2>
                </div>
                {childhood.station ? <strong>{childhood.station.name}</strong> : null}
              </div>
              {childhood.disclaimer ? <p className="stationDisclaimer">{childhood.disclaimer}</p> : null}
              {!childhood.comparison.comparable ? (
                <p className="yearlyNote">{childhood.comparison.reason}</p>
              ) : (
                <>
                  <p className="yearlyNote">
                    Moyenne des maximales et minimales <strong>annuelles</strong> des années complètes — pas une
                    température quotidienne de l’enfance, pas une tendance certifiée, pas une concaténation de
                    stations.
                  </p>
                  <div className="compareMetrics">
                    <div>
                      <span>
                        Enfance {childhood.comparison.childhood.from}–{childhood.comparison.childhood.to} (
                        {childhood.comparison.childhood.n} ans)
                      </span>
                      <strong>{formatCelsius(childhood.comparison.childhood.tmaxMean)}</strong>
                      <small>max. annuelle moyenne</small>
                    </div>
                    <div>
                      <span>
                        Récent {childhood.comparison.recent.from}–{childhood.comparison.recent.to} (
                        {childhood.comparison.recent.n} ans)
                      </span>
                      <strong>{formatCelsius(childhood.comparison.recent.tmaxMean)}</strong>
                      <small>max. annuelle moyenne</small>
                    </div>
                    <div>
                      <span>Écart des max.</span>
                      <strong>{formatSignedCelsius(childhood.comparison.tmaxDelta)}</strong>
                      <small>min. {formatSignedCelsius(childhood.comparison.tminDelta)}</small>
                    </div>
                  </div>
                </>
              )}
            </section>
          ) : null}

          {data?.preferredStation ? (
          <section className="panel chartPanel">
            <div className="panelTitle">
              <div>
                <span>STATION</span>
                <h2>{data.preferredStation.name}</h2>
              </div>
              <strong>NUM_POSTE {data.preferredStation.id}</strong>
            </div>
            <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>Station</th>
                  <th>km</th>
                  <th>alt. m</th>
                </tr>
              </thead>
              <tbody>
                {data.nearbyStations.map((s) => (
                  <tr key={s.id}>
                    <td>
                      {s.name} ({s.id})
                    </td>
                    <td>{s.distanceKm}</td>
                    <td>{s.altitudeM ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            <p className="note">
              {data.stationDisclaimer} {data.attributions[0]}
            </p>
            <p className="note">
              <Link href="/sources">Registre des sources</Link>
            </p>
          </section>
          ) : (
            <p className="note">
              <Link href="/sources">Registre des sources</Link>
            </p>
          )}
          </div>
      ) : null}
    </main>
  );
}

function heatEpisodeRange(episode: HeatEpisode | null | undefined): string {
  if (!episode) return "aucun épisode";
  const start = frenchLongDate(episode.startDate) || episode.startDate;
  const end = frenchLongDate(episode.endDate) || episode.endDate;
  return `${start} → ${end}`;
}
