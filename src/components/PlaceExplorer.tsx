"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import TempRange from "./TempRange";
import YearHeatmap from "./YearHeatmap";
import OriginBadge from "./OriginBadge";
import { IGN_PHOTO_CREDIT, placePhotoSrc } from "@/lib/placeMedia";

const PlaceMap = dynamic(() => import("./PlaceMap"), { ssr: false, loading: () => <div className="mapCanvas mapPlaceholder">Carte IGN…</div> });

type HistoryPayload = {
  date: string;
  place: { name: string; insee_code: string; latitude: number; longitude: number; altitude_m: number | null; timezone: string };
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
    originLabel: string;
    sourceId: string;
    tminDisplay: string;
    tmaxDisplay: string;
    precipDisplay: string;
    tmin: number | null;
    tmax: number | null;
  } | null;
  era5: {
    originLabel: string;
    method: string;
    tminDisplay: string;
    tmaxDisplay: string;
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
  confidence: { score: number; methodVersion: string; breakdown: { label: string; delta: number }[] };
  attributions: string[];
};

export default function PlaceExplorer({ slug, initialDate }: { slug: string; initialDate: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const date = searchParams.get("date") || initialDate;
  const [data, setData] = useState<HistoryPayload | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  function goToDate(next: string) {
    router.replace(`${pathname}?date=${next}`, { scroll: false });
  }

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetch(`/api/v1/history?place=${slug}&date=${date}`, { signal: controller.signal })
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || "Erreur");
        return j;
      })
      .then(setData)
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [slug, date]);

  const chart = useMemo(
    () => (data?.seriesSameDay || []).map((row) => ({ year: row.date.slice(0, 4), tmin: row.tmin, tmax: row.tmax })),
    [data]
  );

  const place = data?.place;

  return (
    <main className="placeVisual">
      <section className="placeHero">
        <Image
          src={placePhotoSrc(slug)}
          alt={place ? `Vue aérienne IGN de ${place.name}` : ""}
          fill
          priority
          sizes="100vw"
        />
        <div className="placeHeroContent">
          <p className="crumb">
            <Link href="/">Accueil</Link>
            <span> / Isère / {place?.name || slug}</span>
          </p>
          <p className="eyebrow">OBSERVATION • CARTE IGN • PAS UNE RÉANALYSE</p>
          <h1>{place?.name || slug}</h1>
          <p>
            {date.split("-").reverse().join("/")}
            {place ? ` · INSEE ${place.insee_code} · ${place.timezone}` : ""}
          </p>
          <p className="photoCredit">{IGN_PHOTO_CREDIT}</p>
          <label className="datePick">
            <span>Choisir un jour</span>
            <input type="date" value={date} onChange={(e) => goToDate(e.target.value)} />
          </label>
        </div>
      </section>

      {error && <div className="error">{error}</div>}
      {loading && <p className="note loadingNote">Chargement des observations…</p>}

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

      {data && !data.preferredStation && (
        <section className="empty panel">
          <h2>Aucune station importée</h2>
          <code>npm run import:meteo -- --department=38 --from=1980 --to=2026</code>
        </section>
      )}

      {data?.preferredStation && (
        <>
          <section className="storyGrid">
            <article className="panel storyMain">
              <div className="storyPhoto">
                <Image src="/images/origin-observed.png" alt="" fill sizes="60vw" />
              </div>
              <OriginBadge kind="OBSERVED" caption={data.preferredStation.name} />
              <TempRange tmin={data.observation?.tmin ?? null} tmax={data.observation?.tmax ?? null} />
              <div className="metricRow">
                <div>
                  <span>Pluie</span>
                  <strong>{data.observation?.precipDisplay || "non disponible"}</strong>
                </div>
                <div>
                  <span>Confiance</span>
                  <strong>{data.confidence.score}/100</strong>
                </div>
                <div>
                  <span>Distance</span>
                  <strong>{data.preferredStation.distanceKm ?? "—"} km</strong>
                </div>
                <div>
                  <span>Δ altitude</span>
                  <strong>{data.preferredStation.altitudeDeltaM ?? "—"} m</strong>
                </div>
              </div>
            </article>
            <article className="panel storySide">
              <div className="storyPhoto storyPhoto-side">
                <Image src="/images/origin-reanalysis.png" alt="" fill sizes="40vw" />
              </div>
              <OriginBadge
                kind="REANALYSIS"
                caption={data.era5 ? `${data.era5.tminDisplay} / ${data.era5.tmaxDisplay}` : "Pas encore ingérée"}
              />
              <p>
                {data.era5
                  ? `Réanalyse ERA5 (${data.era5.method}).`
                  : "Aucune valeur ERA5 n’est inventée. La comparaison apparaîtra après une extraction point réelle."}
              </p>
              {data.comparison && (
                <p className="deltaLine">
                  Écart ERA5 − obs : Tmin {data.comparison.tminDelta ?? "—"} °C · Tmax {data.comparison.tmaxDelta ?? "—"} °C
                </p>
              )}
              <div className="confidenceBars">
                {data.confidence.breakdown.map((b) => (
                  <div key={b.label}>
                    <span>{b.label}</span>
                    <em>{b.delta > 0 ? `+${b.delta}` : b.delta}</em>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="panel chartPanel">
            <div className="panelTitle">
              <div>
                <span>CE JOUR DANS L’HISTOIRE</span>
                <h2>
                  Tous les {date.slice(8, 10)}/{date.slice(5, 7)} observés
                </h2>
              </div>
              {data.recordsObserved && <strong>n={data.recordsObserved.yearsOnThisDay} années</strong>}
            </div>
            {data.recordsObserved && (
              <p className="recordLine">
                Record Tmin {data.recordsObserved.recordTmin ?? "—"} °C ({data.recordsObserved.recordTminDate || "—"}) · Record Tmax{" "}
                {data.recordsObserved.recordTmax ?? "—"} °C ({data.recordsObserved.recordTmaxDate || "—"}) — records de station, pas
                d’ERA5
              </p>
            )}
            <YearHeatmap series={data.seriesSameDay} selected={date} onSelect={goToDate} />
            <div className="chart">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chart}>
                  <CartesianGrid stroke="rgba(255,255,255,.06)" />
                  <XAxis dataKey="year" tick={{ fill: "#70888f", fontSize: 10 }} />
                  <YAxis tick={{ fill: "#70888f", fontSize: 10 }} unit="°C" />
                  <Tooltip />
                  <Line type="monotone" dataKey="tmax" stroke="#ff7b36" dot={false} name="Tmax observée" />
                  <Line type="monotone" dataKey="tmin" stroke="#7ec8ff" dot={false} name="Tmin observée" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="panel chartPanel">
            <div className="panelTitle">
              <div>
                <span>STATION</span>
                <h2>{data.preferredStation.name}</h2>
              </div>
              <strong>NUM_POSTE {data.preferredStation.id}</strong>
            </div>
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
            <p className="note">
              Matching : uniquement les postes avec Tmin/Tmax ce jour-là, puis distance / altitude / couverture.{" "}
              {data.attributions[0]}
            </p>
            <p className="note">
              <Link href="/sources">Registre des sources</Link>
            </p>
          </section>
        </>
      )}
    </main>
  );
}
