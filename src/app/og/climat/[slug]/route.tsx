import { ImageResponse } from "next/og";
import { climateCopyFromYearly, getCommuneYearly } from "@/lib/communeYearly";
import { getPlaceBySlug } from "@/lib/placeHistory";
import { buildClimateShareCardModel } from "@/lib/shareCard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const place = getPlaceBySlug(slug);
  if (!place) {
    return new Response("Commune inconnue.", { status: 404 });
  }
  const climate = climateCopyFromYearly(getCommuneYearly(place.insee_code, { includeDetailRows: false }));
  const card = climate
    ? buildClimateShareCardModel({
        placeName: place.name,
        year: climate.year,
        tmaxMean: climate.tmaxMean,
        precipitationSum: climate.precipitationSum,
        precipComplete: climate.precipComplete,
        stationName: climate.stationName,
        distanceKm: climate.distanceKm
      })
    : null;
  if (!card) {
    return new Response("Aucune année climatique complète.", { status: 404 });
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#071014",
          color: "#edf7f8",
          padding: "56px 64px",
          fontFamily: "sans-serif"
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ color: "#ff7b36", fontSize: 22, letterSpacing: 4, fontWeight: 700 }}>
            OBSERVATOIRE PLANÈTE
          </div>
          <div style={{ fontSize: 64, fontWeight: 700, marginTop: 18, letterSpacing: -2 }}>{card.placeName}</div>
          <div style={{ fontSize: 28, color: "#88a0a8", marginTop: 8 }}>{`Année climatique ${card.year}`}</div>
        </div>
        <div style={{ display: "flex", gap: 36 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 18, color: "#88a0a8" }}>Maximale</div>
            <div style={{ fontSize: 48, fontWeight: 700, color: "#ff7b36" }}>{card.tmaxDisplay}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 18, color: "#88a0a8" }}>Pluie</div>
            <div style={{ fontSize: 48, fontWeight: 700 }}>{card.precipDisplay ?? "non disponible"}</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", color: "#88a0a8", fontSize: 20 }}>
          <div>{card.stationLine}</div>
          <div style={{ marginTop: 8 }}>{card.note}</div>
          <div style={{ marginTop: 8 }}>{card.attribution}</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
