import { ImageResponse } from "next/og";
import { buildHomeOgModel } from "@/lib/landingOg";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const card = buildHomeOgModel();
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
          <div style={{ color: "#ff7b36", fontSize: 22, letterSpacing: 4, fontWeight: 700 }}>{card.kicker}</div>
          <div style={{ fontSize: 52, fontWeight: 700, marginTop: 18, letterSpacing: -2 }}>
            L’histoire météo de votre ville
          </div>
          <div style={{ fontSize: 28, color: "#88a0a8", marginTop: 8 }}>{card.exampleLine}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", gap: 18 }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 16, color: "#88a0a8" }}>Minimale moyenne</div>
              <div style={{ fontSize: 36, fontWeight: 700 }}>{card.tminDisplay ?? "non disponible"}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 16, color: "#88a0a8" }}>Maximale moyenne</div>
              <div style={{ fontSize: 36, fontWeight: 700, color: "#ff7b36" }}>{card.tmaxDisplay}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 16, color: "#88a0a8" }}>Pluie</div>
              <div style={{ fontSize: 36, fontWeight: 700 }}>{card.precipDisplay ?? "non disponible"}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 16, color: "#88a0a8" }}>Jours de pluie</div>
              <div style={{ fontSize: 36, fontWeight: 700 }}>{card.daysRainDisplay ?? "non disponible"}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 18 }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 16, color: "#88a0a8" }}>Jours à 25 °C ou plus</div>
              <div style={{ fontSize: 36, fontWeight: 700 }}>{card.daysGe25Display ?? "non disponible"}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 16, color: "#88a0a8" }}>Jours à 30 °C ou plus</div>
              <div style={{ fontSize: 36, fontWeight: 700 }}>{card.daysGe30Display ?? "non disponible"}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 16, color: "#88a0a8" }}>Jours à 35 °C ou plus</div>
              <div style={{ fontSize: 36, fontWeight: 700 }}>{card.daysGe35Display ?? "non disponible"}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 16, color: "#88a0a8" }}>Jours à 40 °C ou plus</div>
              <div style={{ fontSize: 36, fontWeight: 700 }}>{card.daysGe40Display ?? "non disponible"}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 18 }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 16, color: "#88a0a8" }}>Jours de gel</div>
              <div style={{ fontSize: 36, fontWeight: 700 }}>{card.daysFrostDisplay ?? "non disponible"}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 16, color: "#88a0a8" }}>Nuits tropicales</div>
              <div style={{ fontSize: 36, fontWeight: 700 }}>{card.tropicalNightsDisplay ?? "non disponible"}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 16, color: "#88a0a8" }}>Écart min-max</div>
              <div style={{ fontSize: 36, fontWeight: 700 }}>{card.amplitudeDisplay ?? "non disponible"}</div>
            </div>
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
