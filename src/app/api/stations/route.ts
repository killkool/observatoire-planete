import { NextResponse } from "next/server";
import db from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const rows = db.prepare(`
    SELECT s.id, s.name, s.department, s.latitude, s.longitude, s.altitude,
      MIN(o.date) AS firstDate, MAX(o.date) AS lastDate, COUNT(o.date) AS days
    FROM stations s
    LEFT JOIN observations o ON o.station_id = s.id
    GROUP BY s.id
    ORDER BY s.name
  `).all();
  return NextResponse.json(rows);
}
