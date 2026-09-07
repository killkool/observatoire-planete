"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import CommunePicker, { type CommuneHit } from "./CommunePicker";
import { formatSignedCelsius, formatSignedMm } from "@/lib/compareClimate";
import { formatCelsius, formatMm } from "../../packages/weather-core/src/units";

export type ComparePayload = {
  computed: boolean;
  communeA: { insee: string; name: string; slug: string; path: string | null };
  communeB: { insee: string; name: string; slug: string; path: string | null };
  stationA: { id: string; name: string; distanceKm: number | null } | null;
  stationB: { id: string; name: string; distanceKm: number | null } | null;
  sameStation: boolean;
  disclaimer: string;
  overlap:
    | { comparable: false; reason: string }
    | {
        comparable: true;
        from: number;
        to: number;
        n: number;
        tminMeanA: number | null;
        tmaxMeanA: number | null;
        tminMeanB: number | null;
        tmaxMeanB: number | null;
        tminDelta: number | null;
        tmaxDelta: number | null;
        precipMeanA: number | null;
        precipMeanB: number | null;
        precipDelta: number | null;
        precipYears: number;
      };
  normals:
    | { comparable: false; reason: string }
    | {
        comparable: true;
        period: string;
        tminMeanA: number | null;
        tmaxMeanA: number | null;
        tminMeanB: number | null;
        tmaxMeanB: number | null;
        tminDelta: number | null;
        tmaxDelta: number | null;
        precipMeanA: number | null;
        precipMeanB: number | null;
        precipDelta: number | null;
      };
};

function hitFromCompare(side: ComparePayload["communeA"]): CommuneHit {
  return {
    insee: side.insee,
    name: side.name,
    slug: side.slug,
    department: "Isère",
    region: "Auvergne-Rhône-Alpes",
    path: side.path || ""
  };
}

function compareMatches(payload: ComparePayload | null, inseeA: string, inseeB: string): payload is ComparePayload {
  return Boolean(payload && payload.communeA.insee === inseeA && payload.communeB.insee === inseeB);
}

const FEATURED: { a: CommuneHit; b: CommuneHit }[] = [
  {
    a: {
      insee: "38185",
      name: "Grenoble",
      slug: "grenoble",
      department: "Isère",
      region: "Auvergne-Rhône-Alpes",
      path: "/meteo/auvergne-rhone-alpes/isere/grenoble"
    },
    b: {
      insee: "38140",
      name: "Crolles",
      slug: "crolles",
      department: "Isère",
      region: "Auvergne-Rhône-Alpes",
      path: "/meteo/auvergne-rhone-alpes/isere/crolles"
    }
  },
  {
    a: {
      insee: "38185",
      name: "Grenoble",
      slug: "grenoble",
      department: "Isère",
      region: "Auvergne-Rhône-Alpes",
      path: "/meteo/auvergne-rhone-alpes/isere/grenoble"
    },
    b: {
      insee: "38563",
      name: "Voiron",
      slug: "voiron",
      department: "Isère",
      region: "Auvergne-Rhône-Alpes",
      path: "/meteo/auvergne-rhone-alpes/isere/voiron"
    }
  }
];

export default function CompareCities({
  initialCompare = null
}: {
  initialCompare?: ComparePayload | null;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const inseeA = params.get("a") || "";
  const inseeB = params.get("b") || "";
  const ssrMatch = compareMatches(initialCompare, inseeA, inseeB);
  const [cityA, setCityA] = useState<CommuneHit | null>(() =>
    ssrMatch ? hitFromCompare(initialCompare.communeA) : null
  );
  const [cityB, setCityB] = useState<CommuneHit | null>(() =>
    ssrMatch ? hitFromCompare(initialCompare.communeB) : null
  );
  const [data, setData] = useState<ComparePayload | null>(() => (ssrMatch ? initialCompare : null));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(() => Boolean(inseeA && inseeB && !ssrMatch));

  useEffect(() => {
    function load(insee: string, setCity: (hit: CommuneHit) => void) {
      fetch(`/api/v1/communes/${insee}`)
        .then((r) => r.json())
        .then((j) => {
          if (!j.commune) return;
          setCity({
            insee: j.commune.insee,
            name: j.commune.name,
            slug: j.commune.slug,
            department: j.commune.department,
            region: j.commune.region,
            path: j.commune.path
          });
        })
        .catch(() => {
          /* ignore */
        });
    }
    if (inseeA && cityA?.insee !== inseeA) load(inseeA, setCityA);
    if (inseeB && cityB?.insee !== inseeB) load(inseeB, setCityB);
  }, [inseeA, inseeB, cityA?.insee, cityB?.insee]);

  useEffect(() => {
    if (!inseeA || !inseeB) {
      setData(null);
      setLoading(false);
      return;
    }
    if (compareMatches(initialCompare, inseeA, inseeB)) {
      setData(initialCompare);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetch(`/api/v1/compare?inseeA=${inseeA}&inseeB=${inseeB}`, { signal: controller.signal })
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || "Erreur de comparaison");
        return j as ComparePayload;
      })
      .then((payload) => {
        setData(payload);
        setCityA((prev) =>
          prev?.insee === payload.communeA.insee
            ? prev
            : {
                insee: payload.communeA.insee,
                name: payload.communeA.name,
                slug: payload.communeA.slug,
                department: "Isère",
                region: "Auvergne-Rhône-Alpes",
                path: payload.communeA.path || ""
              }
        );
        setCityB((prev) =>
          prev?.insee === payload.communeB.insee
            ? prev
            : {
                insee: payload.communeB.insee,
                name: payload.communeB.name,
                slug: payload.communeB.slug,
                department: "Isère",
                region: "Auvergne-Rhône-Alpes",
                path: payload.communeB.path || ""
              }
        );
      })
      .catch((e) => {
        if (e.name !== "AbortError") {
          setData(null);
          setError(e.message);
        }
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [inseeA, inseeB, initialCompare]);

  function go(nextA: CommuneHit | null, nextB: CommuneHit | null) {
    if (nextA) setCityA(nextA);
    if (nextB) setCityB(nextB);
    const a = nextA ?? cityA;
    const b = nextB ?? cityB;
    if (!a || !b) return;
    router.replace(`/comparer?a=${a.insee}&b=${b.insee}`, { scroll: false });
  }

  return (
    <div className="comparePage">
      <div className="comparePickers">
        <CommunePicker label="Ville A" selected={cityA} onSelect={(hit) => go(hit, cityB)} />
        <CommunePicker label="Ville B" selected={cityB} onSelect={(hit) => go(cityA, hit)} />
      </div>
      <p className="compareFeatured">
        Exemples :{" "}
        {FEATURED.map((pair, i) => (
          <span key={`${pair.a.insee}-${pair.b.insee}`}>
            {i > 0 ? " · " : null}
            <Link href={`/comparer?a=${pair.a.insee}&b=${pair.b.insee}`}>
              {pair.a.name} vs {pair.b.name}
            </Link>
          </span>
        ))}
      </p>
      {loading ? <p className="note">Comparaison…</p> : null}
      {error ? <p className="error">{error}</p> : null}
      {data ? (
        <>
          <p className="yearlyNote">{data.disclaimer}</p>
          <div className="compareMetrics">
            <div>
              <span>{data.communeA.name}</span>
              <strong>{data.stationA?.name ?? "non disponible"}</strong>
              <small>
                {data.stationA?.distanceKm != null ? `${data.stationA.distanceKm} km` : "station inconnue"}
                {data.communeA.path ? (
                  <>
                    {" "}
                    · <Link href={data.communeA.path}>page commune</Link>
                  </>
                ) : null}
              </small>
            </div>
            <div>
              <span>{data.communeB.name}</span>
              <strong>{data.stationB?.name ?? "non disponible"}</strong>
              <small>
                {data.stationB?.distanceKm != null ? `${data.stationB.distanceKm} km` : "station inconnue"}
                {data.communeB.path ? (
                  <>
                    {" "}
                    · <Link href={data.communeB.path}>page commune</Link>
                  </>
                ) : null}
              </small>
            </div>
          </div>

          <section className="panel chartPanel">
            <div className="panelTitle">
              <div>
                <span>ANNÉES COMMUNES</span>
                <h2>Moyenne des années climatiques partagées</h2>
              </div>
            </div>
            {!data.overlap.comparable ? (
              <p className="yearlyNote">{data.overlap.reason}</p>
            ) : (
              <>
                <p className="yearlyNote">
                  {data.overlap.n} années climatiques de {data.overlap.from} à {data.overlap.to}, chaque série sur son
                  poste. Écart = {data.communeB.name} − {data.communeA.name}.
                </p>
                <div className="compareMetrics">
                  <div>
                    <span>Maximale moyenne</span>
                    <strong>
                      {formatCelsius(data.overlap.tmaxMeanA)} → {formatCelsius(data.overlap.tmaxMeanB)}
                    </strong>
                    <small>{formatSignedCelsius(data.overlap.tmaxDelta)}</small>
                  </div>
                  <div>
                    <span>Minimale moyenne</span>
                    <strong>
                      {formatCelsius(data.overlap.tminMeanA)} → {formatCelsius(data.overlap.tminMeanB)}
                    </strong>
                    <small>{formatSignedCelsius(data.overlap.tminDelta)}</small>
                  </div>
                  <div>
                    <span>Pluie annuelle moyenne</span>
                    <strong>
                      {formatMm(data.overlap.precipMeanA)} → {formatMm(data.overlap.precipMeanB)}
                    </strong>
                    <small>
                      {data.overlap.precipYears >= 5
                        ? formatSignedMm(data.overlap.precipDelta)
                        : "pas assez d’années de pluie complètes"}
                    </small>
                  </div>
                </div>
              </>
            )}
          </section>

          <section className="panel chartPanel">
            <div className="panelTitle">
              <div>
                <span>NORMALES 1991-2020</span>
                <h2>Seulement si chaque poste a 24 années climatiques</h2>
              </div>
            </div>
            {!data.normals.comparable ? (
              <p className="yearlyNote">{data.normals.reason}</p>
            ) : (
              <>
                <p className="yearlyNote">
                  Normale {data.normals.period} de chaque station climatique, pas une normale de commune. Série brute,
                  pas LSH.
                </p>
                <div className="compareMetrics">
                  <div>
                    <span>Maximale</span>
                    <strong>
                      {formatCelsius(data.normals.tmaxMeanA)} → {formatCelsius(data.normals.tmaxMeanB)}
                    </strong>
                    <small>{formatSignedCelsius(data.normals.tmaxDelta)}</small>
                  </div>
                  <div>
                    <span>Minimale</span>
                    <strong>
                      {formatCelsius(data.normals.tminMeanA)} → {formatCelsius(data.normals.tminMeanB)}
                    </strong>
                    <small>{formatSignedCelsius(data.normals.tminDelta)}</small>
                  </div>
                  <div>
                    <span>Pluie</span>
                    <strong>
                      {formatMm(data.normals.precipMeanA)} → {formatMm(data.normals.precipMeanB)}
                    </strong>
                    <small>{formatSignedMm(data.normals.precipDelta)}</small>
                  </div>
                </div>
              </>
            )}
          </section>
        </>
      ) : !loading && !inseeA ? (
        <p className="note">Choisissez deux communes Isère. Une page vue ne télécharge rien chez les fournisseurs.</p>
      ) : null}
    </div>
  );
}
