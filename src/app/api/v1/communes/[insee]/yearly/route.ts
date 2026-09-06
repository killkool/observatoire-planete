import { NextResponse } from "next/server";
import { getCommuneYearly } from "@/lib/communeYearly";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ insee: string }> }) {
  const { insee } = await params;
  const payload = getCommuneYearly(insee);
  if (!payload) return NextResponse.json({ error: "Commune inconnue" }, { status: 404 });
  return NextResponse.json({
    data_version: "slice-isere-v1",
    ...payload
  });
}
