import path from "node:path";
import { ignTileCacheDir, readFileIfExists, writeRawIfAbsent } from "./localPaths";

export const IGN_LAYERS = {
  ortho: {
    wmts: "ORTHOIMAGERY.ORTHOPHOTOS",
    format: "image/jpeg",
    ext: "jpg"
  },
  plan: {
    wmts: "GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2",
    format: "image/png",
    ext: "png"
  }
} as const;

export type IgnLayerId = keyof typeof IGN_LAYERS;

const USER_AGENT = "Observatoire-Planete/1.0 (local IGN tile cache; Licence Ouverte 2.0; not a public proxy)";
const MAX_ZOOM = 18;
const MAX_CONCURRENT_IGN = 2;

let activeIgnFetches = 0;
const ignWaiters: Array<() => void> = [];

export function isAllowedIgnLayer(layer: string): layer is IgnLayerId {
  return layer === "ortho" || layer === "plan";
}

export function parseIgnTile(z: string, y: string, x: string) {
  const zoom = Number(z);
  const row = Number(y);
  const col = Number(x);
  if (![zoom, row, col].every((n) => Number.isInteger(n))) {
    throw new Error("Tuile IGN invalide");
  }
  if (zoom < 0 || zoom > MAX_ZOOM) {
    throw new Error("Niveau de zoom IGN hors limite");
  }
  const max = 2 ** zoom;
  if (row < 0 || col < 0 || row >= max || col >= max) {
    throw new Error("Coordonnées de tuile IGN hors grille");
  }
  return { zoom, row, col };
}

export function ignTileDiskPath(layer: IgnLayerId, zoom: number, row: number, col: number) {
  const ext = IGN_LAYERS[layer].ext;
  return path.join(ignTileCacheDir(), layer, String(zoom), String(row), `${col}.${ext}`);
}

function ignWmtsUrl(layer: IgnLayerId, zoom: number, row: number, col: number) {
  const spec = IGN_LAYERS[layer];
  const params = new URLSearchParams({
    LAYER: spec.wmts,
    EXCEPTIONS: "text/xml",
    FORMAT: spec.format,
    SERVICE: "WMTS",
    VERSION: "1.0.0",
    REQUEST: "GetTile",
    STYLE: "normal",
    TILEMATRIXSET: "PM",
    TILEMATRIX: String(zoom),
    TILEROW: String(row),
    TILECOL: String(col)
  });
  return `https://data.geopf.fr/wmts?${params.toString()}`;
}

async function withIgnSlot<T>(fn: () => Promise<T>): Promise<T> {
  while (activeIgnFetches >= MAX_CONCURRENT_IGN) {
    await new Promise<void>((resolve) => ignWaiters.push(resolve));
  }
  activeIgnFetches += 1;
  try {
    return await fn();
  } finally {
    activeIgnFetches -= 1;
    ignWaiters.shift()?.();
  }
}

export async function getIgnTile(layer: IgnLayerId, zoom: number, row: number, col: number) {
  const spec = IGN_LAYERS[layer];
  const diskPath = ignTileDiskPath(layer, zoom, row, col);
  const cached = readFileIfExists(diskPath);
  if (cached) {
    return { body: cached, contentType: spec.format, fromCache: true as const };
  }
  if (process.env.IGN_TILE_CACHE_ONLY === "true") {
    return { body: null, contentType: spec.format, fromCache: false as const, missing: true as const };
  }

  const remote = await withIgnSlot(async () => {
    const response = await fetch(ignWmtsUrl(layer, zoom, row, col), {
      headers: { "User-Agent": USER_AGENT }
    });
    if (!response.ok) {
      const err = new Error(`IGN Géoplateforme ${response.status}`);
      (err as Error & { status: number }).status = response.status;
      throw err;
    }
    return Buffer.from(await response.arrayBuffer());
  });

  writeRawIfAbsent(diskPath, remote);
  const body = readFileIfExists(diskPath) ?? remote;
  return { body, contentType: spec.format, fromCache: false as const };
}
