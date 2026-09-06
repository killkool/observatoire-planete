"use client";

import { useState } from "react";
import { DownloadCloud } from "lucide-react";

export default function ImportPanel({ onDone }: { onDone: () => void }) {
  const year = new Date().getFullYear();
  const [department, setDepartment] = useState("38");
  const [fromYear, setFromYear] = useState(year - 1);
  const [toYear, setToYear] = useState(year);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function runImport() {
    setBusy(true); setMessage("Téléchargement et import en cours…");
    try {
      const response = await fetch("/api/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ department, fromYear, toYear })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Import impossible");
      setMessage(`${Number(result.rowsWritten || 0).toLocaleString("fr-FR")} observations enregistrées (${result.minDate || "?"} → ${result.maxDate || "?"}).`);
      onDone();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erreur d'import");
    } finally {
      setBusy(false);
    }
  }

  return <section className="panel importer">
    <div className="importHead"><div className="statIcon"><DownloadCloud/></div><div><span>ALIMENTER LA BASE</span><h2>Importer Météo‑France</h2></div></div>
    <div className="importFields">
      <label><span>Département</span><input value={department} onChange={e=>setDepartment(e.target.value.toUpperCase())} maxLength={2}/></label>
      <label><span>Depuis</span><input type="number" value={fromYear} onChange={e=>setFromYear(Number(e.target.value))}/></label>
      <label><span>Jusqu'à</span><input type="number" value={toYear} onChange={e=>setToYear(Number(e.target.value))}/></label>
      <button onClick={runImport} disabled={busy}>{busy ? "Import…" : "Importer"}</button>
    </div>
    {message && <p className="importMessage">{message}</p>}
    <small>
      L’import web lit uniquement les fichiers déjà présents dans <code>raw/</code> — aucune requête data.gouv.
      Pour télécharger une fois : <code>npm run import:meteo -- --department=38 --from=1980 --to=2026</code>
    </small>
  </section>;
}
