
const RIBBON_BORDER_IMAGE = "/CMA - Awards - Medal Texture - Gold.png";

function getRibbonTone(label, isWinner) {
  const normalized = String(label ?? "").toLowerCase();

  if (normalized.includes("honorable")) return "mention";
  if (normalized.includes("second") || normalized.includes("2nd")) return "silver";
  if (normalized.includes("third") || normalized.includes("3rd")) return "bronze";
  if (normalized.includes("first") || normalized.includes("1st") || isWinner) return "gold";

  return "neutral";
}

export default function AwardRibbon({ label, isWinner }) {
  const tone = getRibbonTone(label, isWinner);
  return (
    <div className={`awardRibbon awardRibbon--${tone}`}>
      {RIBBON_BORDER_IMAGE ? <img className="awardRibbon__borderImage" src={RIBBON_BORDER_IMAGE} alt="" aria-hidden="true" /> : null}
      <span className="awardRibbon__label">{label ?? "Result Pending"}</span>
    </div>
  );
}
