import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getAwards } from "../api/awards";
import Loading from "../components/Loading";
import ErrorState from "../components/ErrorState";

export default function AwardsList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") ?? "";

  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;

    async function run() {
      setStatus("loading");
      setError(null);
      try {
        const data = await getAwards("?startedAtUtc=2025-11-03T12%3A00%3A00Z&pageSize=1000"); // expects array
        if (!alive) return;
        if(Array.isArray(data)){
          for(let i = 0; i < data.length; i++){
            
          }
        }
        setItems(Array.isArray(data) ? data : data?.items ?? []);
        setStatus("success");
      } catch (e) {
        if (!alive) return;
        setError(e);
        setStatus("error");
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((a) => (a?.name ?? "").toLowerCase().includes(needle));
  }, [items, q]);

  if (status === "loading") return <Loading label="Loading awards..." />;
  if (status === "error") return <ErrorState error={error} />;

  return (
    <section>
      <div className="row">
        <h1>Awards</h1>
        <input
          className="input"
          value={q}
          onChange={(e) => {
            const next = e.target.value;
            setSearchParams(next ? { q: next } : {});
          }}
          placeholder="Search awards…"
          aria-label="Search awards"
        />
      </div>

      {filtered.length === 0 ? (
        <p>No awards found.</p>
      ) : (
        <ul className="list">
          {filtered.map((award) => (
            <li key={award.id ?? award.slug ?? award.name}>
              <Link to={`/awards/${encodeURIComponent(award.id ?? award.slug ?? award.name)}`}>
                {award.name ?? "Untitled award"}
              </Link>
              {award.description ? <div className="muted">{award.description}</div> : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}