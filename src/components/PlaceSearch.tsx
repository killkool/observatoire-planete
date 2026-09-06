"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { communeHistoryHref } from "@/lib/birthDay";

type Hit = {
  insee: string;
  name: string;
  slug: string;
  department: string;
  region: string;
  path: string;
};

export default function PlaceSearch({
  initialDate,
  autoFocus,
  requireDate = false,
  histoire,
  dateLabel = "Date (optionnel)",
  ctaLabel = "Explorer l’histoire météo de ma ville",
  dateMax
}: {
  initialDate?: string;
  autoFocus?: boolean;
  requireDate?: boolean;
  histoire?: "naissance";
  dateLabel?: string;
  ctaLabel?: string;
  dateMax?: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [date, setDate] = useState(initialDate || "");
  const [hits, setHits] = useState<Hit[]>([]);
  const [open, setOpen] = useState(false);
  const [dateError, setDateError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/v1/search?q=${encodeURIComponent(q)}`, { signal: controller.signal })
        .then((r) => r.json())
        .then((j) => setHits(j.results || []))
        .catch(() => {
          /* ignore abort */
        });
    }, 120);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q]);

  const hint = useMemo(() => {
    if (!q.trim()) return "Grenoble, Voiron, 38000…";
    if (!hits.length) return "Aucune commune Isère pour cette saisie.";
    return "";
  }, [q, hits.length]);

  function go(hit: Hit) {
    if (requireDate && !date) {
      setDateError("Indiquez une date.");
      return;
    }
    setDateError("");
    router.push(date ? communeHistoryHref(hit.path, date, histoire) : hit.path);
  }

  return (
    <form
      className="placeSearch"
      onSubmit={(e) => {
        e.preventDefault();
        if (hits[0]) go(hits[0]);
      }}
    >
      <label className="placeSearchField">
        <span>Recherchez votre ville</span>
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Grenoble, 38400, 38185…"
          autoComplete="off"
          autoFocus={autoFocus}
        />
      </label>
      <label className="placeSearchField placeSearchDate">
        <span>{dateLabel}</span>
        <input type="date" value={date} max={dateMax} onChange={(e) => setDate(e.target.value)} required={requireDate} />
      </label>
      <button type="submit" className="btnPrimary">
        {ctaLabel}
      </button>
      {dateError ? <p className="placeSearchError">{dateError}</p> : null}
      {open && (
        <ul className="placeSearchHits">
          {hits.map((hit) => (
            <li key={hit.insee}>
              <button type="button" onClick={() => go(hit)}>
                <strong>{hit.name}</strong>
                <small>
                  {hit.department} · {hit.region}
                </small>
              </button>
            </li>
          ))}
          {hint ? <li className="placeSearchHint">{hint}</li> : null}
        </ul>
      )}
    </form>
  );
}
