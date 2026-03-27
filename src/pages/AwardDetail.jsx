/*
http://localhost:5174/awards/52750 - First Place
http://localhost:5174/awards/52216 - Honorable Mention
http://localhost:5174/awards/56106 - Not Selected
*/

import React, { useEffect, useMemo, useState, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { getAwardById } from "../api/awards";
import Loading from "../components/Loading";
import ErrorState from "../components/ErrorState";

import Title from "../components/Elements/Title";
import Category from "../components/Elements/Category";
import Result from "../components/Elements/Result";
import WinnerStatus from "../components/Elements/WinnerStatus";

/** Small helpers */
function safeDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? null : d;
}

function pickRound(award) {
  // Prefer the round that was finalized; fall back to the most recently updated.
  const rounds = award?.roundSubmissions ?? [];
  if (!rounds.length) return null;

  const finalized = rounds
    .filter((r) => !!r.finalizedAtUtc)
    .sort((a, b) => new Date(b.finalizedAtUtc) - new Date(a.finalizedAtUtc))[0];

  if (finalized) return finalized;

  return rounds
    .slice()
    .sort((a, b) => new Date(b.updatedAtUtc) - new Date(a.updatedAtUtc))[0];
}

function fieldValue(fieldValues, alias) {
  const hit = fieldValues?.find((f) => f?.alias === alias);
  if (!hit) return null;

  // Different "typeName" shapes exist; normalize a few common ones.
  if (hit.typeName === "ListFieldValue") return hit.selectedValue?.value ?? null;
  if (hit.typeName === "DateFieldValue") return hit.valueUtc ?? null;
  if (hit.typeName === "ApplicationNameFieldValue")
    return hit.firstValue ?? null;

  return hit.value ?? null;
}

function OutcomePill({ isWinner, winnerTypes }) {
  const label = isWinner
    ? (winnerTypes?.[0] ?? "Winner")
    : "Not selected";

  return (
    <span
      className={[
        "pill",
        isWinner ? "pill--win" : "pill--no",
      ].join(" ")}
      title={label}
    >
      {label}
    </span>
  );
}

function HoverCard({ children, className = "", tone = "neutral" }) {
  return (
    <div className={`hcard hcard--${tone} ${className}`.trim()}>
      {children}
    </div>
  );
}

export default function AwardDetail() {
  const { awardId } = useParams();

  const [award, setAward] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;

    async function run() {
      setStatus("loading");
      setError(null);
      try {
        const data = await getAwardById(awardId);
        if (!alive) return;
        setAward(data);
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
  }, [awardId]);

  const round = useMemo(() => pickRound(award), [award]);

  const viewModel = useMemo(() => {
    if (!award) return null;

    const fv = round?.submissionFieldValues ?? [];
    const finalized = safeDate(round?.finalizedAtUtc);
    const workDate = safeDate(fieldValue(fv, "dateOfWork"));

    return {
      id: award.id ?? awardId,
      name: award.name ?? "Award",
      description: award.description ?? null,

      categoryName: award.categoryName ?? null,
      categoryPath: award.categoryPath ?? null,

      roundName: round?.roundName ?? null,
      status: round?.status ?? null,

      year: finalized ? finalized.getFullYear() : null,
      finalizedAtUtc: round?.finalizedAtUtc ?? null,

      isWinner: !!round?.isWinner,
      winnerLabel: round?.isWinner ? (round?.winnerTypes?.[0] ?? "Winner") : null,
      winnerTypes: round?.winnerTypes ?? [],

      avgScore: typeof round?.averageScore === "number" ? round.averageScore : null,
      totalScore:
        typeof round?.judgeScorecardInfos?.[0]?.totalScore === "number"
          ? round.judgeScorecardInfos[0].totalScore
          : null,

      // useful extracted fields
      entryTitle: fieldValue(fv, "titleOfEntry") ?? award.name ?? null,
      publisher:
        fieldValue(fv, "Flask5publisherName") ??
        fieldValue(fv, "searchForAPublisher1") ??
        null,
      publishingType: fieldValue(fv, "publishingType") ?? null,
      byline: fieldValue(fv, "bylineCredits") ?? null,
      submitterFirst: fieldValue(fv, "submitterFirstName") ?? null,
      submitterLast: fieldValue(fv, "submitterLastName") ?? null,
      submitterEmail: fieldValue(fv, "submittersEmailAddress") ?? award.email ?? null,
      workDate: workDate ? workDate.toISOString().slice(0, 10) : null,

      publicGalleryUrl: round?.publicGalleryUrl ?? null,
      publicUrlToSubmission: round?.publicUrlToSubmission ?? null,
      publicDownloadPdfAsApplicantUrl: award.publicDownloadPdfAsApplicantUrl ?? null,
    };
  }, [award, awardId, round]);

  if (status === "loading") return <Loading label="Loading award..." />;
  if (status === "error") return <ErrorState error={error} />;

  if (!award || !viewModel) {
    return (
      <section className="awardPage">
        <p>Not found.</p>
        <Link to="/awards">Back to awards</Link>
      </section>
    );
  }

  const tone = viewModel.isWinner ? "win" : "no";

  return (
    <section className="awardPage">
      <style>{styles}</style>
      <Title entryTitle={viewModel.entryTitle} name={viewModel.name} description={viewModel.description} />
      <Category categoryName={viewModel.categoryName} year={viewModel.year} />
      <Result winnerLabel={viewModel.winnerLabel} />


      {/* <div className="topRow">
        <OutcomePill isWinner={viewModel.isWinner} winnerTypes={viewModel.winnerTypes} />
      </div> */}
      {/* <header ref={title} className="header">
        <h1 className="title word">{viewModel.entryTitle ?? viewModel.name}</h1>
        {viewModel.description ? (
          <p className="muted">{viewModel.description}</p>
        ) : null}
      </header> */}

      <div className="grid">
        {/* Outcome card — changes based on isWinner, with NO "congrats" */}
        <HoverCard tone={tone} className="span2">
          <div className="cardHead">
            <h2 className="cardTitle">Outcome</h2>
            <span className="cardMeta">
              {viewModel.year ? `Year ${viewModel.year}` : "Year unavailable"}
            </span>
          </div>

          {viewModel.isWinner ? (
            <div className="outcomeBody">
              <div className="outcomeLine">
                <span className="label">Result</span>
                <span className="value">{viewModel.winnerLabel}</span>
              </div>
              <p className="note">
                This entry is marked as a winner type in the system.
              </p>
            </div>
          ) : (
            <div className="outcomeBody">
              <div className="outcomeLine">
                <span className="label">Result</span>
                <span className="value">Not selected</span>
              </div>
              <p className="note">
                This submission is complete, but it is not marked as a winning entry.
              </p>
            </div>
          )}
        </HoverCard>

        {/* Core details */}
        <HoverCard tone="neutral">
          <h2 className="cardTitle">Details</h2>
          <dl className="dl">
            {viewModel.status ? <div><dt>Status</dt><dd>{viewModel.status}</dd></div> : null}
            {viewModel.roundName ? <div><dt>Round</dt><dd>{viewModel.roundName}</dd></div> : null}
            {viewModel.finalizedAtUtc ? (
              <div><dt>Finalized</dt><dd>{new Date(viewModel.finalizedAtUtc).toLocaleString()}</dd></div>
            ) : null}
          </dl>
        </HoverCard>

        {/* Category */}
        <HoverCard tone="neutral">
          <h2 className="cardTitle">Category</h2>
          <div className="stack">
            {viewModel.categoryName ? <div className="big">{viewModel.categoryName}</div> : <div className="muted">No category</div>}
            {viewModel.categoryPath ? <div className="muted small">{viewModel.categoryPath}</div> : null}
          </div>
        </HoverCard>

        {/* Publisher / submitter */}
        <HoverCard tone="neutral" className="span2">
          <h2 className="cardTitle">Entry info</h2>
          <div className="twoCol">
            <div>
              <div className="labelRow">Publisher</div>
              <div className="big">{viewModel.publisher ?? "—"}</div>
              <div className="muted small">
                {viewModel.publishingType ? `Type: ${viewModel.publishingType}` : "Type unavailable"}
              </div>
              <div className="muted small">
                {viewModel.workDate ? `Work date: ${viewModel.workDate}` : "Work date unavailable"}
              </div>
              {viewModel.byline ? (
                <div className="muted small">Byline: {viewModel.byline}</div>
              ) : null}
            </div>

            <div>
              <div className="labelRow">Submitter</div>
              <div className="big">
                {[viewModel.submitterFirst, viewModel.submitterLast].filter(Boolean).join(" ") || "—"}
              </div>
              <div className="muted small">{viewModel.submitterEmail ?? "—"}</div>

              {/* Scores: shown but not hyped */}
              <div className="scoreBox">
                <div className="scoreLine">
                  <span className="muted small">Avg score</span>
                  <span className="mono">{viewModel.avgScore ?? "—"}</span>
                </div>
                <div className="scoreLine">
                  <span className="muted small">Total score</span>
                  <span className="mono">{viewModel.totalScore ?? "—"}</span>
                </div>
              </div>
            </div>
          </div>
        </HoverCard>

        {/* Links */}
        <HoverCard tone="neutral" className="span2">
          <h2 className="cardTitle">Links</h2>
          <div className="links">
            {viewModel.publicUrlToSubmission ? (
              <a className="linkBtn" href={viewModel.publicUrlToSubmission} target="_blank" rel="noreferrer">
                View submission
              </a>
            ) : null}
            {viewModel.publicGalleryUrl ? (
              <a className="linkBtn" href={viewModel.publicGalleryUrl} target="_blank" rel="noreferrer">
                Gallery
              </a>
            ) : null}
            {viewModel.publicDownloadPdfAsApplicantUrl ? (
              <a className="linkBtn" href={viewModel.publicDownloadPdfAsApplicantUrl} target="_blank" rel="noreferrer">
                Download PDF
              </a>
            ) : (
              <span className="muted small">No public PDF link</span>
            )}
          </div>
        </HoverCard>
      </div>
      <WinnerStatus status={viewModel.winnerLabel} />
    </section>
  );
}

const styles = `
/* CMA-inspired palette (deep blue/teal + warm gold + cream) */
:root{
  --cma-navy: #123e57;
  --cma-navy-2: #0e2f44;
  --cma-teal: #1c5f7a;
  --cma-gold: #b9a06a;
  --cma-cream: #f6f2ea;
  --cma-paper: #ffffff;
  --cma-ink: #0b1f2a;

  --border: rgba(18, 62, 87, .18);
  --border2: rgba(18, 62, 87, .26);
  --shadow: rgba(11, 31, 42, .10);
  --shadow2: rgba(11, 31, 42, .16);
}

.awardPage{
  max-width:1100px;
  margin:0 auto;
  padding:18px 14px 56px; /* ✅ better mobile spacing */
  color: var(--cma-ink);
}

/* Top row: wraps nicely on mobile */
.topRow{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:10px;
  margin-bottom:12px;
  flex-wrap:wrap; /* ✅ */
}

.backLink{
  color: var(--cma-navy);
  text-decoration:none;
  opacity:.9;
  display:inline-flex;
  align-items:center;
  gap:8px;
  padding:10px 12px;          /* ✅ bigger tap target */
  min-height:44px;            /* ✅ */
  border-radius:12px;
  border:1px solid transparent;
  transition: transform 160ms ease, background 160ms ease, border-color 160ms ease;
}
.backLink:hover{
  opacity:1;
  transform: translateY(-1px);
  background: rgba(18, 62, 87, .06);
  border-color: var(--border);
}

.header{margin:10px 0 14px;}
.title{
  font-size:clamp(20px, 6vw, 28px); /* ✅ responsive type */
  line-height:1.15;
  margin:0 0 6px;
  color: var(--cma-navy-2);
  letter-spacing: .2px;
  word-break:break-word;          /* ✅ long titles */
  overflow-wrap:anywhere;
}
.muted{opacity:.78;margin:0}
.small{font-size:12px}
.big{font-size:16px}
.mono{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace}

/* ✅ Mobile-first grid: 1 col -> 2 cols -> 4 cols */
.grid{
  display:grid;
  grid-template-columns: 1fr;
  gap:12px;
}
@media (min-width: 720px){
  .grid{grid-template-columns: repeat(2, minmax(0, 1fr)); gap:14px;}
  .span2{grid-column: span 2;}
  .twoCol{grid-template-columns:1fr 1fr;}
}
@media (min-width: 1000px){
  .grid{grid-template-columns: repeat(4, minmax(0, 1fr));}
  .span2{grid-column: span 2;}
}

/* Hover card */
.hcard{
  border-radius:18px;
  border: 1px solid var(--border);
  background:
    linear-gradient(180deg, rgba(255,255,255,.92), rgba(255,255,255,.78));
  backdrop-filter: blur(10px);
  padding:12px 12px 14px; /* ✅ slightly tighter on mobile */
  position:relative;
  transform: translateY(0);
  transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease, background 180ms ease;
  box-shadow: 0 10px 26px var(--shadow);
  overflow:hidden;
}

/* subtle “ink wash” highlight */
.hcard::after{
  content:"";
  position:absolute; inset:-2px;
  border-radius:18px;
  opacity:0;
  transition: opacity 180ms ease;
  pointer-events:none;
  background:
    radial-gradient(650px circle at 10% 0%, rgba(28, 95, 122, .18), transparent 55%),
    radial-gradient(550px circle at 90% 80%, rgba(185, 160, 106, .18), transparent 55%);
}

.hcard:hover{
  transform: translateY(-4px);
  box-shadow: 0 18px 42px var(--shadow2);
  border-color: var(--border2);
  background:
    linear-gradient(180deg, rgba(255,255,255,.96), rgba(255,255,255,.82));
}
.hcard:hover::after{opacity:1}

/* tone variants (winner gets a bit more gold; non-winner stays cooler/neutral) */
.hcard--win::after{
  background:
    radial-gradient(650px circle at 15% 0%, rgba(28, 95, 122, .16), transparent 55%),
    radial-gradient(600px circle at 85% 75%, rgba(185, 160, 106, .26), transparent 58%);
}
.hcard--no::after{
  background:
    radial-gradient(650px circle at 15% 0%, rgba(28, 95, 122, .14), transparent 55%),
    radial-gradient(600px circle at 85% 75%, rgba(18, 62, 87, .12), transparent 58%);
}
.hcard--neutral::after{
  background:
    radial-gradient(650px circle at 15% 0%, rgba(28, 95, 122, .14), transparent 55%),
    radial-gradient(600px circle at 85% 75%, rgba(185, 160, 106, .14), transparent 58%);
}

.cardHead{display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin-bottom:10px}
.cardTitle{
  font-size:12px;
  letter-spacing:.08em;
  text-transform:uppercase;
  margin:0;
  color: rgba(14, 47, 68, .78);
}
.cardMeta{font-size:12px;opacity:.7}

/* ✅ DL stacks on small screens */
.dl{display:grid;gap:10px;margin:0}
.dl > div{display:grid;grid-template-columns: 1fr;gap:4px}
@media (min-width: 520px){
  .dl > div{grid-template-columns: 110px 1fr;gap:10px}
}
dt{font-size:12px;opacity:.78}
dd{
  margin:0;
  word-break:break-word;
  overflow-wrap:anywhere; /* ✅ long ids/emails */
}

.stack{display:grid;gap:6px}

/* ✅ two column section stacks on mobile */
.twoCol{display:grid;grid-template-columns:1fr;gap:14px;margin-top:6px}
@media (min-width: 820px){
  .twoCol{grid-template-columns:1fr 1fr;gap:16px}
}
.labelRow{font-size:12px;opacity:.78;margin-bottom:6px}

/* Outcome box */
.outcomeBody{display:grid;gap:10px}
.outcomeLine{
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:12px;
  flex-wrap:wrap; /* ✅ prevent squeeze */
  padding:10px 12px;
  border-radius:14px;
  border:1px solid rgba(18, 62, 87, .16);
  background:
    linear-gradient(180deg, rgba(246,242,234,.65), rgba(255,255,255,.55));
}
.label{font-size:12px;opacity:.78}
.value{
  font-weight:650;
  color: var(--cma-navy-2);
  overflow-wrap:anywhere; /* ✅ winner type text */
}
.note{margin:0;opacity:.78;font-size:13px}

/* Pill */
.pill{
  display:inline-flex; align-items:center; gap:8px;
  border-radius:999px; padding:8px 12px;
  min-height:20px;
  border:1px solid rgba(18, 62, 87, .18);
  background: rgba(255,255,255,.75);
  font-size:12px;
  color: var(--cma-navy-2);
  max-width:100%;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
}
.pill--win{
  border-color: rgba(185, 160, 106, .55);
  background:
    linear-gradient(180deg, rgba(185,160,106,.22), rgba(255,255,255,.72));
}
.pill--no{
  border-color: rgba(18, 62, 87, .22);
  background:
    linear-gradient(180deg, rgba(18,62,87,.10), rgba(255,255,255,.72));
}

/* ✅ Links: full-width buttons on mobile */
.links{
  display:grid;
  grid-template-columns: 1fr;
  gap:10px;
  align-items:stretch;
  margin-top:10px;
}
@media (min-width: 520px){
  .links{display:flex;flex-wrap:wrap;gap:10px;align-items:center}
}

.linkBtn{
  display:inline-flex; align-items:center; justify-content:center;
  padding:10px 12px; border-radius:14px;
  min-height:25px; /* ✅ tap target */
  width:calc(100% - 25px);
  border:1px solid rgba(18, 62, 87, .18);
  background:
    linear-gradient(180deg, rgba(255,255,255,.85), rgba(246,242,234,.55));
  text-decoration:none;
  color: var(--cma-navy-2);
  transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
  box-shadow: 0 10px 22px rgba(11,31,42,.08);
}
@media (min-width: 520px){
  .linkBtn{width:auto;}
}
.linkBtn:hover{
  transform: translateY(-2px);
  box-shadow: 0 14px 30px rgba(11,31,42,.14);
  border-color: rgba(185, 160, 106, .55);
}

/* Score box (quiet, not celebratory) */
.scoreBox{
  margin-top:10px;
  border:1px solid rgba(18, 62, 87, .16);
  border-radius:14px;
  padding:10px 12px;
  background: rgba(255,255,255,.62);
}
.scoreLine{display:flex;align-items:center;justify-content:space-between;gap:12px}
.scoreLine > span{min-width:0}
`;


// import React, { useEffect, useState } from "react";
// import { Link, useParams } from "react-router-dom";
// import { getAwardById } from "../api/awards";
// import Loading from "../components/Loading";
// import ErrorState from "../components/ErrorState";

// export default function AwardDetail() {
//   const { awardId } = useParams();

//   const [award, setAward] = useState(null);
//   const [status, setStatus] = useState("idle");
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     let alive = true;

//     async function run() {
//       setStatus("loading");
//       setError(null);
//       try {
//         const data = await getAwardById(awardId);
//         if (!alive) return;
//         setAward(data);
//         console.log(data)
//         setStatus("success");
//       } catch (e) {
//         if (!alive) return;
//         setError(e);
//         setStatus("error");
//       }
//     }

//     run();
//     return () => {
//       alive = false;
//     };
//   }, [awardId]);

//   if (status === "loading") return <Loading label="Loading award..." />;
//   if (status === "error") return <ErrorState error={error} />;

//   if (!award) {
//     return (
//       <section>
//         <p>Not found.</p>
//         <Link to="/awards">Back to awards</Link>
//       </section>
//     );
//   }

//   return (
//     <section>
//       <Link to="/awards">← Back</Link>
//       <h1>{award.name ?? "Award"}</h1>
//       {award.description ? <p className="muted">{award.description}</p> : null}

//       <div className="card">
//         <div><strong>ID:</strong> {award.id ?? awardId}</div>
//         {award.categoryName ? <div><strong>Category:</strong> {award.categoryName}</div> : null}
//         {award.roundSubmissions[0].finalizedAtUtc ? <div><strong>Year:</strong> {new Date(award.roundSubmissions[0].finalizedAtUtc).getFullYear()}</div> : null}
//         {award.roundSubmissions[0].isWinner ? <div><strong>Winner:</strong> {award.roundSubmissions[0].winnerTypes[0]}</div> : <div><strong>Not a Winner</strong></div>}
//       </div>

//       {/* Drop in nominees / winners / years UI here */}
//     </section>
//   );
// }