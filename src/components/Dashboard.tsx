"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CalendarDays, Database, MapPin, Thermometer, TrendingUp } from "lucide-react";
import ImportPanel from "./ImportPanel";

type Station = { id: string; name: string; department?: string; days: number };
type DashboardData = {
  scope: "france" | "station";
  station?: {id:string; name:string};
  daily: {date:string; tmin:number|null; tmax:number|null; tmean:number|null; stationCount?:number}[];
  monthly: {key:string; label:string; tmean:number; tmin:number|null; tmax:number|null; days:number}[];
  seasons: {key:string; label:string; tmean:number; days:number}[];
  years: {year:number; tmean:number; tmin:number|null; tmax:number|null; days:number}[];
  stats: {firstDate:string|null; lastDate:string|null; observationDays:number; stations:number};
};

const formatTemp = (n:number|null|undefined) => n == null ? "—" : `${n.toFixed(1)} °C`;

export default function Dashboard() {
  const now = new Date();
  const [from, setFrom] = useState(`${now.getFullYear()-5}-01-01`);
  const [to, setTo] = useState(now.toISOString().slice(0,10));
  const [station, setStation] = useState("");
  const [stations, setStations] = useState<Station[]>([]);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => { fetch("/api/stations").then(r=>r.json()).then(setStations).catch(()=>{}); }, [refreshKey]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError("");
    const q = new URLSearchParams({ from, to });
    if (station) q.set("station", station);
    fetch(`/api/dashboard?${q}`, {signal: controller.signal})
      .then(async r => { const j = await r.json(); if (!r.ok) throw new Error(j.error || "Erreur"); return j; })
      .then(setData).catch(e=> { if (e.name !== "AbortError") setError(e.message); }).finally(()=>setLoading(false));
    return () => controller.abort();
  }, [from, to, station, refreshKey]);

  const latest = data?.daily.at(-1);
  const currentMonth = data?.monthly.at(-1);
  const currentSeason = data?.seasons.at(-1);
  const currentYear = data?.years.at(-1);
  const yearlyChart = useMemo(() => data?.years || [], [data]);

  return <main className="shell">
    <header className="hero">
      <div>
        <div className="eyebrow">PROTOTYPE LOCAL • RÉSEAU IMPORTÉ ≠ INDICATEUR OFFICIEL</div>
        <h1>Clima<span>France</span></h1>
        <p>Tableau de bord historique du prototype. Le vertical slice produit est la page Grenoble (observation, provenance, comparaison ERA5).</p>
      </div>
      <div className="live"><i/> Base locale</div>
    </header>

    <ImportPanel onDone={() => setRefreshKey(v => v + 1)} />

    <section className="filters panel">
      <label><span>Périmètre</span><select value={station} onChange={e=>setStation(e.target.value)}>
        <option value="">France — moyenne du réseau importé</option>
        {stations.map(s => <option key={s.id} value={s.id}>{s.name} ({s.department || "?"})</option>)}
      </select></label>
      <label><span>Du</span><input type="date" value={from} onChange={e=>setFrom(e.target.value)}/></label>
      <label><span>Au</span><input type="date" value={to} onChange={e=>setTo(e.target.value)}/></label>
      <div className="source"><MapPin size={16}/> {station ? "Station météo" : "Réseau métropolitain importé"}</div>
    </section>

    {error && <div className="error">{error}</div>}
    {!loading && data && data.daily.length === 0 && <section className="empty panel"><Database size={28}/><h2>Aucune donnée importée</h2><p>Lance l'import Météo‑France pour remplir ta base, puis le tableau de bord se mettra à jour.</p><code>npm run import:meteo -- --department=38 --from=2020 --to=2026</code></section>}

    {data && data.daily.length > 0 && <>
      <section className="cards">
        <StatCard icon={<Thermometer/>} label="Dernier jour" value={formatTemp(latest?.tmean)} sub={latest?.date || "—"}/>
        <StatCard icon={<CalendarDays/>} label="Moyenne du mois" value={formatTemp(currentMonth?.tmean)} sub={currentMonth?.label || "—"}/>
        <StatCard icon={<TrendingUp/>} label="Moyenne saison" value={formatTemp(currentSeason?.tmean)} sub={currentSeason?.label || "—"}/>
        <StatCard icon={<Database/>} label="Moyenne annuelle" value={formatTemp(currentYear?.tmean)} sub={currentYear ? String(currentYear.year) : "—"}/>
      </section>

      <section className="grid2">
        <div className="panel chartPanel">
          <div className="panelTitle"><div><span>ÉVOLUTION</span><h2>Température moyenne quotidienne</h2></div><strong>{data.stats.observationDays.toLocaleString("fr-FR")} jours</strong></div>
          <div className="chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data.daily} margin={{left:-18,right:8,top:10,bottom:0}}>
            <defs><linearGradient id="tempFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="currentColor" stopOpacity={0.30}/><stop offset="100%" stopColor="currentColor" stopOpacity={0}/></linearGradient></defs>
            <CartesianGrid vertical={false} strokeDasharray="3 6" opacity={0.18}/><XAxis dataKey="date" minTickGap={60}/><YAxis unit="°"/>
            <Tooltip formatter={(v:any)=>[`${Number(v).toFixed(1)} °C`, "Moyenne"]}/><Area type="monotone" dataKey="tmean" stroke="currentColor" fill="url(#tempFill)" strokeWidth={2} dot={false}/>
          </AreaChart></ResponsiveContainer></div>
        </div>

        <div className="panel chartPanel">
          <div className="panelTitle"><div><span>CLIMATOLOGIE</span><h2>Moyennes par année</h2></div><strong>{data.years.length} années</strong></div>
          <div className="chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={yearlyChart} margin={{left:-18,right:8,top:10,bottom:0}}>
            <CartesianGrid vertical={false} strokeDasharray="3 6" opacity={0.18}/><XAxis dataKey="year" minTickGap={20}/><YAxis unit="°"/>
            <Tooltip formatter={(v:any)=>[`${Number(v).toFixed(1)} °C`, "Moyenne"]}/><Bar dataKey="tmean" fill="currentColor" radius={[6,6,0,0]}/>
          </BarChart></ResponsiveContainer></div>
        </div>
      </section>

      <section className="panel tablePanel">
        <div className="panelTitle"><div><span>SYNTHÈSE</span><h2>Moyennes mensuelles</h2></div><strong>{data.stats.stations.toLocaleString("fr-FR")} stations en base</strong></div>
        <div className="tableWrap"><table><thead><tr><th>Mois</th><th>Moyenne</th><th>Mini moy.</th><th>Maxi moy.</th><th>Jours</th></tr></thead><tbody>
          {data.monthly.slice(-24).reverse().map(m => <tr key={m.key}><td>{m.label}</td><td className="hot">{formatTemp(m.tmean)}</td><td>{formatTemp(m.tmin)}</td><td>{formatTemp(m.tmax)}</td><td>{m.days}</td></tr>)}
        </tbody></table></div>
      </section>

      <div className="note">La vue « France » est la moyenne arithmétique du réseau de stations importé. C’est un indice personnel de suivi, pas la température moyenne nationale officielle de Météo‑France.</div>
    </>}
  </main>;
}

function StatCard({icon,label,value,sub}:{icon:ReactNode;label:string;value:string;sub:string}) {
  return <div className="panel stat"><div className="statIcon">{icon}</div><div><span>{label}</span><strong>{value}</strong><small>{sub}</small></div></div>;
}
