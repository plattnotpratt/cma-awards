import AwardResultItem from "./AwardResultItem";

function flattenAwards(hierarchy) {
  return hierarchy.flatMap((program) =>
    program.divisions.flatMap((division) =>
      division.categories.flatMap((category) =>
        category.awards.map((award) => ({
          ...award,
          context: `${program.name} / ${division.name} / ${category.name}`,
          sortKey: `${program.name} / ${division.name} / ${category.name} / ${award.placementRank} / ${award.entryTitle}`,
        })),
      ),
    ),
  );
}

export default function SearchResults({ hierarchy, query, resultsRef }) {
  const awards = flattenAwards(hierarchy).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  const hasQuery = query.trim().length > 0;

  return (
    <section className="browserResults card" ref={resultsRef}>
      <div className="browserResults__header">
        <div>
          <h2>{hasQuery ? "Search results" : "All awards"}</h2>
          <p className="muted">
            {awards.length === 1 ? "1 award found." : `${awards.length} awards found.`}
          </p>
        </div>
      </div>

      {awards.length === 0 ? (
        <p>No awards matched your search.</p>
      ) : (
        <ul className="browserResults__list">
          {awards.map((award) => (
            <AwardResultItem key={`${award.context}::${award.id}`} award={award} context={award.context} />
          ))}
        </ul>
      )}
    </section>
  );
}
