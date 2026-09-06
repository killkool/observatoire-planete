import { NextResponse } from "next/server";
import db from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const sources = db.prepare(`SELECT * FROM data_sources`).all();
  return NextResponse.json({
    data_version: "slice-isere-v1",
    sources,
    note: "Seules les sources effectivement utilisées apparaissent sur les pages lieu."
  });
}
