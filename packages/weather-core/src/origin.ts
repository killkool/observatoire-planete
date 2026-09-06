export const DataOriginType = {
  OBSERVED: "OBSERVED",
  REANALYSIS: "REANALYSIS",
  SATELLITE: "SATELLITE",
  FORECAST: "FORECAST",
  DERIVED: "DERIVED",
  HOMOGENIZED: "HOMOGENIZED",
  INTERPOLATED: "INTERPOLATED",
  BLENDED: "BLENDED",
  MODEL: "MODEL",
  CLIMATOLOGY: "CLIMATOLOGY"
} as const;

export type DataOriginType = (typeof DataOriginType)[keyof typeof DataOriginType];

/** Labels techniques (méthodologie, « En savoir plus »). */
export const ORIGIN_LABEL_FR: Record<DataOriginType, string> = {
  OBSERVED: "Observation",
  REANALYSIS: "Réanalyse",
  SATELLITE: "Satellite",
  FORECAST: "Prévision",
  DERIVED: "Dérivé",
  HOMOGENIZED: "Homogénéisé",
  INTERPOLATED: "Interpolé",
  BLENDED: "Produit mixte",
  MODEL: "Modèle",
  CLIMATOLOGY: "Climatologie"
};

/** Labels grand public. Le backend garde DataOriginType. */
export const ORIGIN_LABEL_PUBLIC_FR: Record<DataOriginType, string> = {
  OBSERVED: "Mesure officielle",
  REANALYSIS: "Estimation climatique",
  SATELLITE: "Image satellite",
  FORECAST: "Prévision",
  DERIVED: "Indicateur calculé",
  HOMOGENIZED: "Série climatique corrigée",
  INTERPOLATED: "Estimation interpolée",
  BLENDED: "Produit mixte",
  MODEL: "Modèle",
  CLIMATOLOGY: "Normale climatique"
};

export function assertNotObservation(origin: DataOriginType) {
  return origin !== "OBSERVED";
}
