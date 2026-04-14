import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Loading from "../components/Loading";
import ErrorState from "../components/ErrorState";
import { useAwards } from "../hooks/useAwards";

export default function AwardsList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") ?? "";

  const { awards, status, error } = useAwards("?startedAtUtc=2025-11-03T12%3A00%3A00Z&pageSize=1000");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return awards;
    return awards.filter((a) => (a?.name ?? "").toLowerCase().includes(needle));
  }, [awards, q]);

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
