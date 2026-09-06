import { NextResponse } from "next/server";
import { getPlaceByInsee } from "@/lib/placeHistory";
import { communePath, departmentLabel, regionLabel } from "@/lib/placeUrl";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ insee: string }> }) {
  const { insee } = await params;
  const place = getPlaceByInsee(insee);
  if (!place) return NextResponse.json({ error: "Commune inconnue" }, { status: 404 });
  return NextResponse.json({
    data_version: "slice-isere-v1",
    commune: {
      insee: place.insee_code,
      name: place.name,
      slug: place.slug,
      department: departmentLabel(place.department_slug),
      region: regionLabel(place.region_slug),
      latitude: place.latitude,
      longitude: place.longitude,
      altitudeM: place.altitude_m,
      path: communePath(place)
    }
  });
}
