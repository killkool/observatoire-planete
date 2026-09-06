import fs from "node:fs";
import path from "node:path";

export type FetchMode = "local-first" | "offline" | "refresh";

export function repoRoot() {
  return process.cwd();
}

export function rawMeteoFranceDir() {
  return path.join(repoRoot(), "raw", "meteo-france", "quotidiennes");
}

export function rawGeoApiDir() {
  return path.join(repoRoot(), "raw", "geo-api-gouv");
}

export function ignTileCacheDir() {
  return path.join(repoRoot(), "data", "tiles", "ign");
}

export function writeRawIfAbsent(filePath: string, data: Buffer | string) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  if (fs.existsSync(filePath)) return false;
  const tmp = `${filePath}.tmp`;
  fs.writeFileSync(tmp, data);
  fs.renameSync(tmp, filePath);
  return true;
}

export function readFileIfExists(filePath: string) {
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath);
}
