"use client";

import { useEffect, useState } from "react";

export type CommuneHit = {
  insee: string;
  name: string;
  slug: string;
  department: string;
  region: string;
  path: string;
};

export default function CommunePicker({
  label,
  selected,
  onSelect
}: {
  label: string;
  selected: CommuneHit | null;
  onSelect: (hit: CommuneHit) => void;
}) {
  const [q, setQ] = useState(selected?.name ?? "");
  const [hits, setHits] = useState<CommuneHit[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setQ(selected?.name ?? "");
  }, [selected?.name, selected?.insee]);

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

  return (
    <label className="placeSearchField communePicker">
      <span>{label}</span>
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Grenoble, Crolles, 38000…"
        autoComplete="off"
      />
      {open && q.trim() ? (
        <ul className="placeSearchHits">
          {hits.map((hit) => (
            <li key={hit.insee}>
              <button
                type="button"
                onClick={() => {
                  onSelect(hit);
                  setQ(hit.name);
                  setOpen(false);
                }}
              >
                {hit.name}
                <small>
                  {hit.department} · {hit.insee}
                </small>
              </button>
            </li>
          ))}
          {!hits.length ? <li className="placeSearchHint">Aucune commune Isère pour cette saisie.</li> : null}
        </ul>
      ) : null}
    </label>
  );
}
