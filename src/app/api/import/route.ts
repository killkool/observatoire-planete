import { NextRequest, NextResponse } from "next/server";
import { ingestMeteoFranceDaily } from "@/lib/ingestMeteoFrance";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const department = String(body.department || "38").toUpperCase();
  const fromYear = Number(body.fromYear || new Date().getFullYear() - 1);
  const toYear = Number(body.toYear || new Date().getFullYear());

  if (!Number.isInteger(fromYear) || !Number.isInteger(toYear) || fromYear > toYear) {
    return NextResponse.json({ error: "Période invalide" }, { status: 400 });
  }

  try {
    const result = await ingestMeteoFranceDaily(department, fromYear, toYear);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur d'import" }, { status: 500 });
  }
}
