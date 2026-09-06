import { NextResponse } from "next/server";
import { getIgnTile, isAllowedIgnLayer, parseIgnTile } from "@/lib/ignTiles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ layer: string; z: string; y: string; x: string }> }
) {
  const { layer, z, y, x } = await params;
  if (!isAllowedIgnLayer(layer)) {
    return NextResponse.json({ error: "Couche IGN inconnue" }, { status: 400 });
  }
  try {
    const tile = parseIgnTile(z, y, x);
    const result = await getIgnTile(layer, tile.zoom, tile.row, tile.col);
    if (!result.body) {
      return NextResponse.json({ error: "Tuile absente du cache local" }, { status: 404 });
    }
    return new NextResponse(new Uint8Array(result.body), {
      headers: {
        "Content-Type": result.contentType,
        "Cache-Control": "public, max-age=2592000, immutable",
        "X-Tile-Cache": result.fromCache ? "hit" : "miss"
      }
    });
  } catch (error) {
    const status = (error as { status?: number }).status;
    if (status === 429) {
      return NextResponse.json({ error: "IGN a limité le débit. Réessayer plus tard — le cache local n’a pas été écrit." }, { status: 429 });
    }
    const message = error instanceof Error ? error.message : "Tuile IGN impossible";
    const code = message.includes("invalide") || message.includes("hors") ? 400 : 502;
    return NextResponse.json({ error: message }, { status: code });
  }
}
