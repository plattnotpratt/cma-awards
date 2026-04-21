import { Link } from "react-router-dom";

function resultTone(type) {
  if (type === "first_place") return "resultBadge--gold";
  if (type === "second_place") return "resultBadge--silver";
  if (type === "third_place") return "resultBadge--bronze";
  if (type === "honorable_mention") return "resultBadge--mention";
  return "resultBadge--neutral";
}

export default function CategoryResults({ program, division, category }) {
  return (
    <section className="browserResults card">
      <div className="browserResults__header">
        <div>
          <p className="browserResults__eyebrow">Category Results</p>
          <h2>{category?.name ?? "Select a category"}</h2>
          <p className="muted">
            {category ? `${program.name} / ${division.name} / ${category.name}` : "Choose a program, division, and category to see the winners list."}
          </p>
        </div>
      </div>

      {!category ? null : category.awards.length === 0 ? (
        <p>No awards found for this category.</p>
      ) : (
        <ul className="browserResults__list">
          {category.awards.map((award) => (
            <li key={award.id}>
              <div className="browserResults__titleRow">
                <Link to={`/awards/${encodeURIComponent(award.id)}`}>{award.entryTitle}</Link>
                <span className={`resultBadge ${resultTone(award.placementType)}`}>{award.placementLabel}</span>
              </div>
              {award.publisher ? <div className="muted">{award.publisher}</div> : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
