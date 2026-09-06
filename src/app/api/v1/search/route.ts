import { NextRequest, NextResponse } from "next/server";
import { searchPlaces } from "@/lib/placeHistory";
import { communePath, departmentLabel, regionLabel } from "@/lib/placeUrl";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const q = new URL(request.url).searchParams.get("q") || "";
  const places = searchPlaces(q, 12).map((place) => ({
    insee: place.insee_code,
    name: place.name,
    slug: place.slug,
    department: departmentLabel(place.department_slug),
    region: regionLabel(place.region_slug),
    path: communePath(place)
  }));
  return NextResponse.json({ query: q, results: places, data_version: "slice-isere-v1" });
}
