import db from "./db";
import { getSeason } from "./seasons";

export function rebuildFranceDaily(fromDate?: string, toDate?: string) {
  const where: string[] = [];
  const params: string[] = [];
  if (fromDate) { where.push("date >= ?"); params.push(fromDate); }
  if (toDate) { where.push("date <= ?"); params.push(toDate); }
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const dates = db.prepare(`SELECT DISTINCT date FROM observations ${clause} ORDER BY date`).all(...params) as {date:string}[];
  const upsert = db.prepare(`
    INSERT INTO france_daily(date, tmin, tmax, tmean, station_count)
    SELECT
      date,
      AVG(tmin),
      AVG(tmax),
      AVG(COALESCE(tmean, CASE WHEN tmin IS NOT NULL AND tmax IS NOT NULL THEN (tmin + tmax) / 2.0 END)),
      COUNT(COALESCE(tmean, CASE WHEN tmin IS NOT NULL AND tmax IS NOT NULL THEN 1 END))
    FROM observations
    WHERE date = ?
    GROUP BY date
    ON CONFLICT(date) DO UPDATE SET
      tmin = excluded.tmin,
      tmax = excluded.tmax,
      tmean = excluded.tmean,
      station_count = excluded.station_count
  `);

  const tx = db.transaction((items: {date:string}[]) => {
    for (const item of items) upsert.run(item.date);
  });
  tx(dates);
  return dates.length;
}

export type DashboardPayload = {
  scope: "france" | "station";
  station?: { id: string; name: string };
  daily: { date: string; tmin: number | null; tmax: number | null; tmean: number | null; stationCount?: number }[];
  monthly: { key: string; label: string; tmean: number; tmin: number | null; tmax: number | null; days: number }[];
  seasons: { key: string; label: string; tmean: number; days: number }[];
  years: { year: number; tmean: number; tmin: number | null; tmax: number | null; days: number }[];
  stats: { firstDate: string | null; lastDate: string | null; observationDays: number; stations: number };
};

function round(n: number | null, digits = 2) {
  if (n == null || !Number.isFinite(n)) return null;
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}

export function getDashboard(from: string, to: string, stationId?: string): DashboardPayload {
  let dailyRows: any[];
  let station: { id: string; name: string } | undefined;

  if (stationId) {
    station = db.prepare("SELECT id, name FROM stations WHERE id = ?").get(stationId) as any;
    dailyRows = db.prepare(`
      SELECT date, tmin, tmax,
        COALESCE(tmean, CASE WHEN tmin IS NOT NULL AND tmax IS NOT NULL THEN (tmin+tmax)/2.0 END) AS tmean
      FROM observations
      WHERE station_id = ? AND date BETWEEN ? AND ?
      ORDER BY date
    `).all(stationId, from, to) as any[];
  } else {
    dailyRows = db.prepare(`
      SELECT date, tmin, tmax, tmean, station_count AS stationCount
      FROM france_daily
      WHERE date BETWEEN ? AND ?
      ORDER BY date
    `).all(from, to) as any[];
  }

  const daily = dailyRows.map((r) => ({
    date: r.date,
    tmin: round(r.tmin),
    tmax: round(r.tmax),
    tmean: round(r.tmean),
    stationCount: r.stationCount
  }));

  const monthMap = new Map<string, any[]>();
  const yearMap = new Map<number, any[]>();
  const seasonMap = new Map<string, {label:string; rows:any[]}>();

  for (const row of dailyRows) {
    if (row.tmean == null) continue;
    const monthKey = row.date.slice(0, 7);
    monthMap.set(monthKey, [...(monthMap.get(monthKey) || []), row]);
    const year = Number(row.date.slice(0, 4));
    yearMap.set(year, [...(yearMap.get(year) || []), row]);
    const s = getSeason(row.date);
    const key = `${s.seasonYear}-${s.season}`;
    const current = seasonMap.get(key) || { label: s.label, rows: [] };
    current.rows.push(row);
    seasonMap.set(key, current);
  }

  const avg = (rows:any[], key:string) => {
    const vals = rows.map((r) => r[key]).filter((v) => v != null && Number.isFinite(v));
    return vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : null;
  };

  const monthly = [...monthMap.entries()].map(([key, rows]) => ({
    key,
    label: new Intl.DateTimeFormat("fr-FR", { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${key}-15T12:00:00Z`)),
    tmean: round(avg(rows, "tmean"))!,
    tmin: round(avg(rows, "tmin")),
    tmax: round(avg(rows, "tmax")),
    days: rows.length
  }));

  const seasons = [...seasonMap.entries()].map(([key, value]) => ({
    key,
    label: value.label,
    tmean: round(avg(value.rows, "tmean"))!,
    days: value.rows.length
  }));

  const years = [...yearMap.entries()].map(([year, rows]) => ({
    year,
    tmean: round(avg(rows, "tmean"))!,
    tmin: round(avg(rows, "tmin")),
    tmax: round(avg(rows, "tmax")),
    days: rows.length
  }));

  const firstDate = daily.at(0)?.date || null;
  const lastDate = daily.at(-1)?.date || null;
  const stations = stationId
    ? 1
    : ((db.prepare("SELECT COUNT(*) as count FROM stations").get() as {count:number}).count || 0);

  return {
    scope: stationId ? "station" : "france",
    station,
    daily,
    monthly,
    seasons,
    years,
    stats: { firstDate, lastDate, observationDays: daily.length, stations }
  };
}
