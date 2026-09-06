import { NextResponse } from "next/server";
import { getCommuneChildhood } from "@/lib/communeYearly";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ insee: string }> }) {
  const { insee } = await params;
  const birthYear = Number(new URL(request.url).searchParams.get("birthYear"));
  if (!Number.isInteger(birthYear)) {
    return NextResponse.json({ error: "Paramètre birthYear (entier) requis." }, { status: 400 });
  }
  const payload = getCommuneChildhood(insee, birthYear);
  if (!payload) return NextResponse.json({ error: "Commune inconnue" }, { status: 404 });
  return NextResponse.json({
    data_version: "slice-isere-v1",
    ...payload
  });
}
