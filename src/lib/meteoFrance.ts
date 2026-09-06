import { createGunzip } from "node:zlib";
import { createHash } from "node:crypto";
import { Readable } from "node:stream";
import { parse } from "csv-parse";

export const DATASET_API = "https://www.data.gouv.fr/api/1/datasets/donnees-climatologiques-de-base-quotidiennes/";
export const SOURCE_ID = "meteo-france.climatologie.quotidienne.bulk";
export const DATASET_ID = "6569b51ae64326786e4e8e1a";

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

export async function listDailyResources(department: string, fromYear: number, toYear: number) {
  const response = await fetch(DATASET_API, { cache: "no-store" });
  if (!response.ok) throw new Error(`data.gouv.fr a répondu ${response.status}`);
  const dataset = (await response.json()) as DatasetResponse;

  return (dataset.resources || [])
    .map((resource) => ({ resource, name: resourceName(resource) }))
    .filter(({ resource, name }) => {
      const url = resource.url || resource.latest || "";
      const isCsvGz = /csv\.gz($|\?)/i.test(url) || /csv\.gz$/i.test(name) || resource.format === "csv.gz";
      if (!isCsvGz) return false;
      if (!resourceMatchesDepartment(name, department)) return false;
      if (!isTemperatureResource(name)) return false;
      const range = extractRange(name);
      if (!range) return true;
      return range[1] >= fromYear && range[0] <= toYear;
    });
}

export async function downloadCompressed(resource: DataGouvResource) {
  const url = resource.url || resource.latest;
  if (!url) throw new Error("Ressource sans URL");
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Téléchargement impossible (${response.status})`);
  const compressed = Buffer.from(await response.arrayBuffer());
  const checksumSha256 = createHash("sha256").update(compressed).digest("hex");
  return { compressed, checksumSha256, bytes: compressed.length, url, name: resourceName(resource) };
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
