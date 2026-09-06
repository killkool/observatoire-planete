import { NextRequest, NextResponse } from "next/server";
import { getDashboard } from "@/lib/aggregates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") || "1950-01-01";
  const to = searchParams.get("to") || new Date().toISOString().slice(0,10);
  const stationId = searchParams.get("station") || undefined;

  try {
    return NextResponse.json(getDashboard(from, to, stationId));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur" }, { status: 500 });
  }
}
