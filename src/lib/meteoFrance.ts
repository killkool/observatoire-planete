import { createGunzip } from "node:zlib";
import { createHash } from "node:crypto";
import { Readable } from "node:stream";
import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse";
import { type FetchMode, rawMeteoFranceDir, readFileIfExists, writeRawIfAbsent } from "./localPaths";

export const DATASET_API = "https://www.data.gouv.fr/api/1/datasets/donnees-climatologiques-de-base-quotidiennes/";
export const SOURCE_ID = "meteo-france.climatologie.quotidienne.bulk";
export const DATASET_ID = "6569b51ae64326786e4e8e1a";
const USER_AGENT = "Observatoire-Planete/1.0 (local bulk cache; Licence Ouverte 2.0)";

type DataGouvResource = {
  title?: string;
  url?: string;
  latest?: string;
  format?: string;
  mime?: string;
};

type DatasetResponse = { resources?: DataGouvResource[] };

export type MeteoRow = {
  NUM_POSTE?: string;
  NOM_USUEL?: string;
  LAT?: string;
  LON?: string;
  ALTI?: string;
  AAAAMMJJ?: string;
  TN?: string;
  TX?: string;
  TM?: string;
  RR?: string;
};

function normalizeDepartment(department: string) {
  const d = department.trim().toUpperCase();
  if (d === "2A" || d === "2B") return d;
  return d.padStart(2, "0");
}

function resourceName(r: DataGouvResource) {
  return (r.title || r.url || "").split("/").pop() || "";
}

function isTemperatureResource(name: string) {
  return /RR-T-Vent/i.test(name) || /quot/i.test(name);
}

function resourceMatchesDepartment(name: string, department: string) {
  const d = normalizeDepartment(department);
  return new RegExp(`(?:^|[_-])${d}(?:[_-])`, "i").test(name) || name.toUpperCase().includes(`DEPARTEMENT_${d}`);
}

function extractRange(name: string): [number, number] | null {
  const before = name.match(/(?:avant|before)[-_]?(\d{4})/i);
  if (before) return [0, Number(before[1])];
  const all = [...name.matchAll(/(18|19|20)\d{2}/g)].map((m) => Number(m[0]));
  if (!all.length) return null;
  if (all.length === 1) return [all[0], all[0]];
  return [Math.min(...all), Math.max(...all)];
}

export function filterDailyResources(
  resources: DataGouvResource[],
  department: string,
  fromYear: number,
  toYear: number
) {
  return resources
    .map((resource) => ({ resource, name: resourceName(resource) }))
    .filter(({ resource, name }) => {
      const url = resource.url || resource.latest || "";
      const isCsvGz =
        /csv\.gz($|\?)/i.test(url) ||
        /csv\.gz$/i.test(name) ||
        resource.format === "csv.gz" ||
        name.toLowerCase().endsWith(".csv.gz");
      if (!isCsvGz) return false;
      if (!resourceMatchesDepartment(name, department)) return false;
      if (!isTemperatureResource(name)) return false;
      const range = extractRange(name);
      if (!range) return true;
      return range[1] >= fromYear && range[0] <= toYear;
    });
}

function catalogFiles() {
  const dir = rawMeteoFranceDir();
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => name.startsWith(`catalog-${DATASET_ID}`) && name.endsWith(".json"))
    .map((name) => {
      const full = path.join(dir, name);
      return { full, mtime: fs.statSync(full).mtimeMs };
    })
    .sort((a, b) => b.mtime - a.mtime);
}

function readLatestCatalog(): DatasetResponse | null {
  const latest = catalogFiles()[0];
  if (!latest) return null;
  return JSON.parse(fs.readFileSync(latest.full, "utf8")) as DatasetResponse;
}

function persistCatalog(dataset: DatasetResponse) {
  const body = JSON.stringify(dataset);
  const checksum = createHash("sha256").update(body).digest("hex").slice(0, 12);
  writeRawIfAbsent(path.join(rawMeteoFranceDir(), `catalog-${DATASET_ID}-${checksum}.json`), body);
}

function resourcesFromDisk(department: string, fromYear: number, toYear: number) {
  const dir = rawMeteoFranceDir();
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter((name) => name.toLowerCase().endsWith(".csv.gz"));
  const resources: DataGouvResource[] = files.map((name) => ({
    title: name,
    url: path.join(dir, name),
    format: "csv.gz"
  }));
  return filterDailyResources(resources, department, fromYear, toYear);
}

export async function listDailyResources(
  department: string,
  fromYear: number,
  toYear: number,
  mode: FetchMode = "local-first"
) {
  const localCatalog = mode !== "refresh" ? readLatestCatalog() : null;
  if (localCatalog) {
    return filterDailyResources(localCatalog.resources || [], department, fromYear, toYear);
  }

  const fromFiles = resourcesFromDisk(department, fromYear, toYear);
  if (mode === "offline") {
    if (fromFiles.length) return fromFiles;
    throw new Error(
      `Catalogue data.gouv absent de ${rawMeteoFranceDir()}. Relancer npm run import:meteo -- --refresh une seule fois.`
    );
  }

  if (mode === "local-first" && fromFiles.length) {
    return fromFiles;
  }

  const response = await fetch(DATASET_API, {
    cache: "no-store",
    headers: { "User-Agent": USER_AGENT }
  });
  if (!response.ok) throw new Error(`data.gouv.fr a répondu ${response.status}`);
  const dataset = (await response.json()) as DatasetResponse;
  persistCatalog(dataset);
  return filterDailyResources(dataset.resources || [], department, fromYear, toYear);
}

export async function loadCompressed(
  resource: DataGouvResource,
  mode: FetchMode = "local-first"
) {
  const name = resourceName(resource);
  if (!name) throw new Error("Ressource sans nom de fichier");
  const dest = path.join(rawMeteoFranceDir(), name);
  const cached = readFileIfExists(dest);
  if (cached) {
    const checksumSha256 = createHash("sha256").update(cached).digest("hex");
    return {
      compressed: cached,
      checksumSha256,
      bytes: cached.length,
      url: dest,
      name,
      fromCache: true
    };
  }

  const remoteUrl = resource.url || resource.latest;
  if (remoteUrl && fs.existsSync(remoteUrl)) {
    const compressed = fs.readFileSync(remoteUrl);
    const checksumSha256 = createHash("sha256").update(compressed).digest("hex");
    writeRawIfAbsent(dest, compressed);
    return { compressed, checksumSha256, bytes: compressed.length, url: remoteUrl, name, fromCache: true };
  }

  if (mode === "offline") {
    throw new Error(`Fichier absent du cache local : ${dest}. Relancer npm run import:meteo -- --refresh.`);
  }
  if (!remoteUrl) throw new Error("Ressource sans URL");
  if (remoteUrl.startsWith("http") === false) {
    throw new Error(`Fichier local introuvable : ${remoteUrl}`);
  }

  const response = await fetch(remoteUrl, {
    cache: "no-store",
    headers: { "User-Agent": USER_AGENT }
  });
  if (!response.ok) throw new Error(`Téléchargement impossible (${response.status})`);
  const compressed = Buffer.from(await response.arrayBuffer());
  const checksumSha256 = createHash("sha256").update(compressed).digest("hex");
  writeRawIfAbsent(dest, compressed);
  return { compressed, checksumSha256, bytes: compressed.length, url: remoteUrl, name, fromCache: false };
}

export async function* iterateCsvRows(compressed: Buffer): AsyncGenerator<MeteoRow> {
  const parser = parse({
    columns: true,
    delimiter: ";",
    skip_empty_lines: true,
    relax_column_count: true,
    bom: true,
    trim: true
  });
  const unzip = createGunzip();
  Readable.from(compressed).pipe(unzip).pipe(parser);
  for await (const row of parser) {
    yield row as MeteoRow;
  }
}

export function parseDate(value?: string) {
  if (!value) return null;
  const clean = value.replace(/\D/g, "");
  if (clean.length !== 8) return null;
  return `${clean.slice(0, 4)}-${clean.slice(4, 6)}-${clean.slice(6, 8)}`;
}

export function parseTemperature(value?: string) {
  return parseNumber(value);
}

export function parseNumber(value?: string) {
  if (value == null || value === "") return null;
  const n = Number(value.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}
