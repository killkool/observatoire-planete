import { NextResponse } from "next/server";
import { getCommuneCityCompare, getCommuneYearCompare } from "@/lib/communeYearly";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const inseeA = url.searchParams.get("inseeA")?.trim() ?? "";
  const inseeB = url.searchParams.get("inseeB")?.trim() ?? "";
  if (inseeA && inseeB) {
    const payload = getCommuneCityCompare(inseeA, inseeB);
    if (!payload) return NextResponse.json({ error: "Une commune est inconnue." }, { status: 404 });
    return NextResponse.json({
      data_version: "slice-isere-v1",
      ...payload
    });
  }

  const insee = url.searchParams.get("insee")?.trim() ?? "";
  const yearA = Number(url.searchParams.get("yearA"));
  const yearB = Number(url.searchParams.get("yearB"));
  if (!insee || !Number.isInteger(yearA) || !Number.isInteger(yearB)) {
    return NextResponse.json(
      { error: "Indiquez inseeA et inseeB (villes) ou insee, yearA et yearB (années)." },
      { status: 400 }
    );
  }
  const payload = getCommuneYearCompare(insee, yearA, yearB);
  if (!payload) return NextResponse.json({ error: "Commune inconnue" }, { status: 404 });
  return NextResponse.json({
    data_version: "slice-isere-v1",
    ...payload
  });
}
