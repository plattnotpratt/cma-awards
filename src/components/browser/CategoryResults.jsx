import AwardResultItem from "./AwardResultItem";

export default function CategoryResults({ category, resultsRef }) {
  return (
    <section className="browserResults card" ref={resultsRef}>
      <div className="browserResults__header">
        <div>
          <h2>{category?.name ?? "Select a category"}</h2>
          <p className="muted">
            {category ? "Winners listed in placement order." : "Choose a program, division, and category to see the winners list."}
          </p>
        </div>
      </div>

      {!category ? null : category.awards.length === 0 ? (
        <p>No awards found for this category.</p>
      ) : (
        <ul className="browserResults__list">
          {category.awards.map((award) => (
            <AwardResultItem key={award.id} award={award} />
          ))}
        </ul>
      )}
    </section>
  );
}
