import { ImageResponse } from "next/og";
import { buildCompareLandingOgModel } from "@/lib/landingOg";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const card = buildCompareLandingOgModel();
  if (!card) {
    return new Response("Aucun exemple comparable.", { status: 404 });
  }

  const vsLine = `${card.communeA} vs ${card.communeB}`;
  const tmaxLine = `${card.tmaxA} → ${card.tmaxB}`;

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
          <div style={{ color: "#ff7b36", fontSize: 22, letterSpacing: 4, fontWeight: 700 }}>VILLE VS VILLE</div>
          <div style={{ fontSize: 52, fontWeight: 700, marginTop: 18, letterSpacing: -2 }}>{vsLine}</div>
          <div style={{ fontSize: 28, color: "#88a0a8", marginTop: 8 }}>Exemple. Deux postes, pas un écart inventé.</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 18, color: "#88a0a8" }}>Maximale moyenne</div>
          <div style={{ fontSize: 56, fontWeight: 700, color: "#ff7b36" }}>{tmaxLine}</div>
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
