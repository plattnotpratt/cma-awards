export default function AwardRibbon({ label, isWinner }) {
  const tone = isWinner ? "win" : "neutral";
  return (
    <div className={`awardRibbon awardRibbon--${tone}`}>
      <span className="awardRibbon__label">{label ?? "Result Pending"}</span>
    </div>
  );
}
