import type { Metadata } from "next";
import db from "@/lib/db";
import Link from "next/link";
import OriginKinds from "@/components/OriginKinds";
import PageBanner from "@/components/PageBanner";
import { frenchLanguageAlternates } from "@/lib/seoContent";

export const metadata: Metadata = {
  title: "Sources et licences — Observatoire Planète",
  description:
    "Registre des sources météo : licences, origines, ce qui peut entrer dans le produit. E-OBS est désactivé.",
  alternates: frenchLanguageAlternates("/sources")
};

export default function SourcesPage() {
  const sources = db.prepare(`SELECT * FROM data_sources`).all() as {
    source_id: string;
    legal_status: string;
    enabled: number;
    origin_type: string;
    license_name: string;
    attribution: string;
  }[];

  return (
    <main className="docVisual">
      <PageBanner
        image="/images/hero-earth.png"
        eyebrow="REGISTRE"
        title={
          <>
            Sources <span>et licences</span>
          </>
        }
        lead="Une source REQUIRES_REVIEW, RESTRICTED ou DISABLED n’alimente pas l’offre commerciale. E-OBS est désactivé."
      />

      <OriginKinds />

      <section className="panel tablePanel docPanel">
        <div className="panelTitle">
          <div>
            <span>CATALOGUE EXÉCUTABLE</span>
            <h2>Ce qui peut entrer dans le produit</h2>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>source_id</th>
              <th>origine</th>
              <th>licence</th>
              <th>statut</th>
              <th>activée</th>
            </tr>
          </thead>
          <tbody>
            {sources.map((s) => (
              <tr key={s.source_id}>
                <td>{s.source_id}</td>
                <td>{s.origin_type}</td>
                <td>{s.license_name}</td>
                <td>
                  <em className={`chip chip-${s.legal_status.toLowerCase()}`}>{s.legal_status}</em>
                </td>
                <td>{s.enabled ? "oui" : "non"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {sources.map((s) =>
          s.attribution ? (
            <p key={s.source_id + "-attr"} className="note">
              {s.source_id} : {s.attribution}
            </p>
          ) : null
        )}
        <p className="note">
          <Link href="/methodology">Méthode de calcul</Link>
        </p>
      </section>
    </main>
  );
}
