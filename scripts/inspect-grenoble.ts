import db from "../src/lib/db";

const count = db.prepare(`SELECT COUNT(*) AS n FROM observations WHERE date = '1983-05-12'`).get() as { n: number };
const sample = db.prepare(`
  SELECT s.id, s.name, s.latitude, s.longitude, s.altitude, o.tmin, o.tmax
  FROM observations o JOIN stations s ON s.id = o.station_id
  WHERE o.date = '1983-05-12'
  LIMIT 20
`).all();
const grenoble = db.prepare(`
  SELECT id, name, latitude, longitude, altitude,
    (SELECT MIN(date) FROM observations o WHERE o.station_id = stations.id) AS firstDate,
    (SELECT MAX(date) FROM observations o WHERE o.station_id = stations.id) AS lastDate,
    (SELECT COUNT(*) FROM observations o WHERE o.station_id = stations.id) AS days
  FROM stations
  WHERE name LIKE '%GRENOBLE%' OR id LIKE '38185%'
`).all();
console.log("obs on 1983-05-12", count);
console.log("sample", sample);
console.log("grenoble-ish", grenoble);
