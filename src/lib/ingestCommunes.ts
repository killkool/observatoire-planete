import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import db from "./db";
import { assertCommercialSource } from "../../packages/licensing/src/gate";
import { slugifyFr } from "./slugify";
import { type FetchMode, rawGeoApiDir, writeRawIfAbsent } from "./localPaths";

/** Validation slice: keep proven coordinates (Grenoble 1983 matching). */
export const PINNED_INSEE = new Set(["38185", "38140", "38303"]);

const SOURCE_ID = "etalab.geo-api.communes";

type GeoCommune = {
  nom: string;
  code: string;
  codesPostaux?: string[];
  centre?: { type: string; coordinates: [number, number] };
  codeRegion?: string;
  population?: number;
};
type CommuneSnapshot = {
  fetched_at?: string;
  department: { nom: string; code: string; codeRegion: string };
  region: { nom: string; code: string };
  communes: GeoCommune[];
};

const USER_AGENT = "Observatoire-Planete/1.0 (local commune import; Licence Ouverte)";

export function communeSnapshotChecksum(snapshot: Pick<CommuneSnapshot, "department" | "region" | "communes">) {
  return createHash("sha256")
    .update(JSON.stringify({ department: snapshot.department, region: snapshot.region, communes: snapshot.communes }))
    .digest("hex");
}

function snapshotCandidates(departmentCode: string) {
  const dir = rawGeoApiDir();
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => name.startsWith(`communes-${departmentCode}`) && name.endsWith(".json"))
    .map((name) => {
      const full = path.join(dir, name);
      return { full, mtime: fs.statSync(full).mtimeMs };
    })
    .sort((a, b) => b.mtime - a.mtime);
}

function persistCommuneSnapshot(departmentCode: string, snapshot: CommuneSnapshot) {
  const checksum = communeSnapshotChecksum(snapshot).slice(0, 12);
  const body = JSON.stringify(snapshot);
  writeRawIfAbsent(path.join(rawGeoApiDir(), `communes-${departmentCode}-${checksum}.json`), body);
}

export async function loadIsereCommuneSnapshot(
  mode: FetchMode = "local-first"
): Promise<{ snapshot: CommuneSnapshot; rawPath: string; fromCache: boolean }> {
  const departmentCode = "38";
  const latest = snapshotCandidates(departmentCode)[0];
  if (latest && mode !== "refresh") {
    return {
      snapshot: JSON.parse(fs.readFileSync(latest.full, "utf8")) as CommuneSnapshot,
      rawPath: latest.full,
      fromCache: true
    };
  }
  if (mode === "offline") {
    throw new Error(
      `Référentiel communes absent de ${rawGeoApiDir()}. Relancer npm run import:communes -- --refresh une seule fois.`
    );
  }

  const communesUrl = `https://geo.api.gouv.fr/departements/${departmentCode}/communes?fields=nom,code,codesPostaux,centre,codeRegion,population&format=json`;
  const department = (await fetchJson(`https://geo.api.gouv.fr/departements/${departmentCode}`)) as CommuneSnapshot["department"];
  const region = (await fetchJson(`https://geo.api.gouv.fr/regions/${department.codeRegion}`)) as CommuneSnapshot["region"];
  const communes = (await fetchJson(communesUrl)) as GeoCommune[];
  if (!Array.isArray(communes) || communes.length === 0) {
    throw new Error("Réponse communes vide — aucun lieu inventé.");
  }
  const snapshot: CommuneSnapshot = {
    fetched_at: new Date().toISOString(),
    department,
    region,
    communes
  };
  persistCommuneSnapshot(departmentCode, snapshot);
  const stored = snapshotCandidates(departmentCode)[0];
  return {
    snapshot: stored ? (JSON.parse(fs.readFileSync(stored.full, "utf8")) as CommuneSnapshot) : snapshot,
    rawPath: stored?.full || path.join(rawGeoApiDir(), `communes-${departmentCode}.json`),
    fromCache: false
  };
}

async function fetchJson(url: string) {
  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} pour ${url}`);
  }
  return response.json();
}

export async function ingestIsereCommunes(mode: FetchMode = "local-first") {
  const source = assertCommercialSource(SOURCE_ID);
  const { snapshot, rawPath } = await loadIsereCommuneSnapshot(mode);
  const { department, region, communes } = snapshot;
  const departmentCode = department.code;
  const communesUrl = `https://geo.api.gouv.fr/departements/${departmentCode}/communes?fields=nom,code,codesPostaux,centre,codeRegion,population&format=json`;
  if (!Array.isArray(communes) || communes.length === 0) {
    throw new Error("Réponse communes vide — aucun lieu inventé.");
  }

  const checksum = communeSnapshotChecksum(snapshot);
  const payloadBytes = Buffer.byteLength(JSON.stringify(snapshot));

  const existingChecksum = db.prepare(`SELECT checksum_sha256 FROM import_files WHERE checksum_sha256 = ?`).get(checksum) as
    | { checksum_sha256: string }
    | undefined;

  const regionSlug = slugifyFr(region.nom);
  const departmentSlug = slugifyFr(department.nom);

  db.prepare(
    `INSERT INTO regions(code, name, slug) VALUES (?, ?, ?)
     ON CONFLICT(code) DO UPDATE SET name=excluded.name, slug=excluded.slug`
  ).run(region.code, region.nom, regionSlug);
  db.prepare(
    `INSERT INTO departments(code, name, slug, region_code) VALUES (?, ?, ?, ?)
     ON CONFLICT(code) DO UPDATE SET name=excluded.name, slug=excluded.slug, region_code=excluded.region_code`
  ).run(department.code, department.nom, departmentSlug, region.code);

  const usedSlugs = new Set<string>(
    (db.prepare(`SELECT slug FROM places`).all() as { slug: string }[]).map((row) => row.slug)
  );

  const selectExisting = db.prepare(`SELECT latitude, longitude, altitude_m, slug FROM places WHERE place_id = ?`);
  const upsert = db.prepare(`
    INSERT INTO places(
      place_id, place_kind, country_code, insee_code, name, slug,
      latitude, longitude, altitude_m, timezone, surface_type,
      region_slug, department_slug, postal_codes, population, source_id
    ) VALUES (
      @place_id, 'city', 'FR', @insee_code, @name, @slug,
      @latitude, @longitude, @altitude_m, 'Europe/Paris', 'LAND',
      @region_slug, @department_slug, @postal_codes, @population, @source_id
    )
    ON CONFLICT(place_id) DO UPDATE SET
      name=excluded.name,
      slug=excluded.slug,
      latitude=excluded.latitude,
      longitude=excluded.longitude,
      altitude_m=excluded.altitude_m,
      postal_codes=excluded.postal_codes,
      population=excluded.population,
      region_slug=excluded.region_slug,
      department_slug=excluded.department_slug,
      source_id=excluded.source_id
  `);

  let written = 0;
  let skippedNoCentre = 0;
  const tx = db.transaction(() => {
    for (const commune of communes) {
      const coords = commune.centre?.coordinates;
      if (!coords || coords.length < 2 || coords[0] == null || coords[1] == null) {
        skippedNoCentre += 1;
        continue;
      }
      const insee = commune.code;
      const placeId = `fr-com-${insee}`;
      const existing = selectExisting.get(placeId) as
        | { latitude: number; longitude: number; altitude_m: number | null; slug: string }
        | undefined;
      const pinnedPlace = PINNED_INSEE.has(insee) ? existing : undefined;
      const longitude = pinnedPlace ? pinnedPlace.longitude : coords[0];
      const latitude = pinnedPlace ? pinnedPlace.latitude : coords[1];
      const altitude_m = pinnedPlace ? pinnedPlace.altitude_m : null;
      let slug = pinnedPlace?.slug || slugifyFr(commune.nom);
      if (!slug) slug = `commune-${insee}`;
      if (!pinnedPlace && usedSlugs.has(slug) && existing?.slug !== slug) {
        slug = `${slug}-${insee}`;
      }
      usedSlugs.add(slug);
      upsert.run({
        place_id: placeId,
        insee_code: insee,
        name: commune.nom,
        slug,
        latitude,
        longitude,
        altitude_m,
        region_slug: regionSlug,
        department_slug: departmentSlug,
        postal_codes: (commune.codesPostaux || []).join(","),
        population: commune.population ?? null,
        source_id: SOURCE_ID
      });
      written += 1;
    }
  });
  tx();

  if (!existingChecksum) {
    const lineageId = randomUUID();
    db.prepare(
      `INSERT INTO data_lineage(lineage_id, displayed_as, steps, raw_uri, checksum_sha256, method_version, created_at)
       VALUES (?, 'commune_referential', ?, ?, ?, 'geo-api-communes-isere-v1', ?)`
    ).run(
      lineageId,
      JSON.stringify([{ step: "geo.api.gouv.fr" }, { department: departmentCode }, { no_contours: true }]),
      rawPath,
      checksum,
      new Date().toISOString()
    );
    db.prepare(
      `INSERT INTO import_files(checksum_sha256, uri, bytes, source_id, downloaded_at, rows_written)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(checksum, communesUrl, payloadBytes, SOURCE_ID, new Date().toISOString(), written);
  }

  return {
    source: source.sourceId,
    attribution: source.attribution,
    communesApi: communes.length,
    written,
    skippedNoCentre,
    checksum,
    region: region.nom,
    department: department.nom
  };
}
