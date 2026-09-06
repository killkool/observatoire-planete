import { ImageResponse } from "next/og";
import { isIsoDate } from "@/lib/birthDay";
import { getPlaceHistory } from "@/lib/placeHistory";
import { buildShareCardModel } from "@/lib/shareCard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string; date: string }> }
) {
  const { slug, date } = await params;
  if (!isIsoDate(date)) {
    return new Response("Date invalide.", { status: 400 });
  }
  const history = getPlaceHistory(slug, date);
  if (!history) {
    return new Response("Commune inconnue.", { status: 404 });
  }
  const card = buildShareCardModel({
    placeName: history.place.name,
    isoDate: date,
    hasObservation: Boolean(history.observation),
    tminDisplay: history.observation?.tminDisplay,
    tmaxDisplay: history.observation?.tmaxDisplay,
    precipDisplay: history.observation?.precipDisplay,
    stationName: history.preferredStation?.name,
    distanceKm: history.preferredStation?.distanceKm,
    attribution: history.observation ? history.attributions?.[0] ?? null : null
  });

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
          <div style={{ fontSize: 28, color: "#88a0a8", marginTop: 8 }}>{card.dateLabel}</div>
        </div>
        {card.hasObservation ? (
          <div style={{ display: "flex", gap: 36 }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 18, color: "#88a0a8" }}>Minimale</div>
              <div style={{ fontSize: 48, fontWeight: 700 }}>{card.tminDisplay}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 18, color: "#88a0a8" }}>Maximale</div>
              <div style={{ fontSize: 48, fontWeight: 700, color: "#ff7b36" }}>{card.tmaxDisplay}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 18, color: "#88a0a8" }}>Pluie</div>
              <div style={{ fontSize: 48, fontWeight: 700 }}>{card.precipDisplay}</div>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 36, color: "#ffb35b" }}>{card.note}</div>
        )}
        <div style={{ display: "flex", flexDirection: "column", color: "#88a0a8", fontSize: 20 }}>
          {card.stationLine ? <div>{card.stationLine}</div> : null}
          <div style={{ marginTop: 8 }}>{card.attribution}</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
