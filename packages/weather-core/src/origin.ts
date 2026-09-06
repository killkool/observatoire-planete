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

export function assertNotObservation(origin: DataOriginType) {
  return origin !== "OBSERVED";
}
