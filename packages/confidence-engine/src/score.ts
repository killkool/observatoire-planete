import { DataOriginType } from "../../weather-core/src/origin";

export type ConfidenceInput = {
  originType: DataOriginType;
  distanceKm: number | null;
  altitudeDeltaM: number | null;
  qualitySuspect: boolean;
  coverageOk: boolean;
  interpolated: boolean;
  independentCorroboration: boolean;
};

export type ConfidenceResult = {
  score: number;
  methodVersion: "confidence-v1-draft";
  breakdown: { label: string; delta: number }[];
};

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function scoreConfidence(input: ConfidenceInput): ConfidenceResult {
  const breakdown: { label: string; delta: number }[] = [];
  let score = 0;

  const bases: Record<string, number> = {
    OBSERVED: 70,
    HOMOGENIZED: 65,
    REANALYSIS: 45,
    SATELLITE: 40,
    BLENDED: 40,
    MODEL: 35,
    FORECAST: 35,
    INTERPOLATED: 25,
    DERIVED: 25,
    CLIMATOLOGY: 50
  };
  const base = bases[input.originType] ?? 20;
  score += base;
  breakdown.push({ label: `Type ${input.originType}`, delta: base });

  if (input.originType === "OBSERVED" && input.distanceKm != null) {
    let d = 0;
    if (input.distanceKm < 5) d = 10;
    else if (input.distanceKm < 20) d = 5;
    else if (input.distanceKm > 50) d = -10;
    if (d) {
      score += d;
      breakdown.push({ label: `Distance ${input.distanceKm.toFixed(1)} km`, delta: d });
    }
  }

  if (input.altitudeDeltaM != null) {
    const abs = Math.abs(input.altitudeDeltaM);
    let d = 0;
    if (abs < 50) d = 5;
    else if (abs > 300) d = -10;
    if (d) {
      score += d;
      breakdown.push({ label: `Δ altitude ${Math.round(input.altitudeDeltaM)} m`, delta: d });
    }
  }

  if (input.coverageOk) {
    score += 5;
    breakdown.push({ label: "Couverture au jour demandé", delta: 5 });
  } else {
    score -= 15;
    breakdown.push({ label: "Trou de couverture", delta: -15 });
  }

  if (input.qualitySuspect) {
    score -= 20;
    breakdown.push({ label: "Indicateur qualité suspect", delta: -20 });
  }

  if (input.independentCorroboration) {
    score += 5;
    breakdown.push({ label: "Cohérence avec une source d'un autre groupe de dépendance", delta: 5 });
  }

  if (input.interpolated) {
    score = Math.min(score, 55);
    breakdown.push({ label: "Plafond interpolation", delta: 0 });
  }

  return { score: clamp(score), methodVersion: "confidence-v1-draft", breakdown };
}
