/** Bbox V1 documentée (~41–51°N, 5°W–10°E) + petit buffer. Quelques jours 2t quotidiens peuvent exister en JSON ; pas un dump SQL mondial. */
export const ERA5_FRANCE_LAT = { min: 41, max: 51.5 };
export const ERA5_FRANCE_LON = { min: -5.5, max: 10 };

export function isInFranceEra5Bbox(lat: number, lon: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= ERA5_FRANCE_LAT.min &&
    lat <= ERA5_FRANCE_LAT.max &&
    lon >= ERA5_FRANCE_LON.min &&
    lon <= ERA5_FRANCE_LON.max
  );
}

export function assertFranceEra5Point(lat: number, lon: number): void {
  if (!isInFranceEra5Bbox(lat, lon)) {
    throw new Error(
      `Point ERA5 hors bbox France V1 (${ERA5_FRANCE_LAT.min}–${ERA5_FRANCE_LAT.max}°N, ${ERA5_FRANCE_LON.min}–${ERA5_FRANCE_LON.max}°E) : ${lat}, ${lon}. Pas d’extraction mondiale.`
    );
  }
}

/** Jours 2t quotidiens bbox France extraits en JSON. Pas l’archive 1940–2026, pas un import SQL. */
export const ERA5_FRANCE_DAILY_2T_DATES = ["1983-05-11", "1983-05-12", "1983-05-13"] as const;
export const ERA5_FRANCE_DAILY_2T_CELLS = 2709;
/** Jours avec extraction **point** Grenoble importée. Preuve = 1983-05-12 ; 1982/1986 = records du 12 mai CORENC. */
export const ERA5_POINT_DATES = [
  "1982-05-12",
  "1983-05-11",
  "1983-05-12",
  "1983-05-13",
  "1986-05-12"
] as const;
