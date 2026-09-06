export type LegalStatus =
  | "APPROVED_COMMERCIAL"
  | "APPROVED_NON_COMMERCIAL"
  | "REQUIRES_REVIEW"
  | "RESTRICTED"
  | "DISABLED";

export type SourceRecord = {
  sourceId: string;
  legalStatus: LegalStatus;
  enabled: boolean;
  originType: string;
  attribution: string;
  licenseName: string;
};

/** Runtime allowlist mirrored from packages/licensing/registry/data-sources.yaml (Phase 0 audit 2026-09-06). */
export const SOURCE_CATALOG: SourceRecord[] = [
  {
    sourceId: "meteo-france.climatologie.quotidienne.bulk",
    legalStatus: "APPROVED_COMMERCIAL",
    enabled: true,
    originType: "OBSERVED",
    attribution: "Source : Météo-France — Données climatologiques de base (quotidiennes), Licence Ouverte 2.0.",
    licenseName: "Licence Ouverte 2.0"
  },
  {
    sourceId: "copernicus.c3s.era5.single-levels-hourly",
    legalStatus: "APPROVED_COMMERCIAL",
    enabled: true,
    originType: "REANALYSIS",
    attribution:
      "Contient des informations Copernicus Climate Change Service modifiées. ERA5 DOI 10.24381/cds.adbb2d47. CC-BY-4.0. Ni la Commission européenne ni l’ECMWF ne sont responsables de l’usage qui pourrait être fait des informations Copernicus.",
    licenseName: "CC-BY-4.0"
  },
  {
    sourceId: "ecad.e-obs",
    legalStatus: "DISABLED",
    enabled: false,
    originType: "INTERPOLATED",
    attribution: "",
    licenseName: "E-OBS non-commercial"
  }
];

export function getSource(sourceId: string): SourceRecord | undefined {
  return SOURCE_CATALOG.find((s) => s.sourceId === sourceId);
}

export function assertCommercialSource(sourceId: string): SourceRecord {
  const source = getSource(sourceId);
  if (!source) {
    throw new Error(`Source inconnue: ${sourceId}. Ajouter d'abord le registre et l'audit licence.`);
  }
  if (source.legalStatus !== "APPROVED_COMMERCIAL") {
    throw new Error(`Source ${sourceId} refusée (${source.legalStatus}).`);
  }
  if (!source.enabled) {
    throw new Error(`Source ${sourceId} non activée.`);
  }
  return source;
}
