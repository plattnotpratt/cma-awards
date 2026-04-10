import { Link } from "react-router-dom";
import "./AwardDetails.css";

function formatDate(dateStr) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function AwardDetails({ award }) {
  if (!award) return null;

  const submitter = [award.submitterFirst, award.submitterLast].filter(Boolean).join(" ");

  const cards = [
    {
      title: "Overview",
      items: [
        { label: "Round", value: award.roundName },
        { label: "Status", value: award.status },
        { label: "Finalized", value: formatDate(award.finalizedAtUtc) },
      ],
    },
    {
      title: "Entry",
      items: [
        { label: "Publisher", value: award.publisher },
        { label: "Type", value: award.publishingType },
        { label: "Work date", value: award.workDate },
        { label: "Byline", value: award.byline },
      ],
    },
    {
      title: "Submitter",
      items: [
        { label: "Name", value: submitter },
        { label: "Email", value: award.submitterEmail },
      ],
    },
    {
      title: "Scores",
      items: [
        { label: "Average", value: award.avgScore ?? "—" },
        { label: "Total", value: award.totalScore ?? "—" },
      ],
    },
  ];

  const links = [
    { label: "View submission", href: award.publicUrlToSubmission },
    { label: "Gallery", href: award.publicGalleryUrl },
    { label: "Download PDF", href: award.publicDownloadPdfAsApplicantUrl },
  ];

  return (
    <section className="awardNotes">
      <div className="awardNotes__intro">
        <p className="awardNotes__eyebrow">Program Notes</p>
        <h2>Additional record</h2>
        <p>Details for administrators and historians. The presentation lives above; reference this section when you need the paperwork.</p>
      </div>

      <div className="awardNotes__grid">
        {cards.map((card) => (
          <article className="programCard" key={card.title}>
            <h3>{card.title}</h3>
            <dl>
              {card.items.map((item) => (
                <div key={`${card.title}-${item.label}`}>
                  <dt>{item.label}</dt>
                  <dd>{item.value ?? "—"}</dd>
                </div>
              ))}
            </dl>
          </article>
        ))}

        <article className="programCard programCard--links">
          <h3>Links</h3>
          <div className="programCard__links">
            {links.map((link) =>
              link.href ? (
                <a className="programLink" key={link.label} href={link.href} target="_blank" rel="noreferrer">
                  {link.label}
                </a>
              ) : null
            )}
            {!links.some((link) => link.href) ? <span className="programCard__empty">No public links available.</span> : null}
          </div>
        </article>
      </div>

      <div className="awardNotes__footer">
        <Link to="/awards" className="awardNotes__back">
          ← Browse all awards
        </Link>
      </div>
    </section>
  );
}
