import { NextRequest, NextResponse } from "next/server";
import { defaultDateForPlace, getPlaceHistory } from "@/lib/placeHistory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("place") || "grenoble";
  const date = searchParams.get("date") || defaultDateForPlace(slug);
  const data = getPlaceHistory(slug, date);
  if (!data) return NextResponse.json({ error: "Lieu inconnu" }, { status: 404 });
  return NextResponse.json({ data_version: "slice-isere-v1", method_version: "place-history-v1", ...data });
}
