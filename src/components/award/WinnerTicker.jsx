const ITEMS = 8;

export default function WinnerTicker({ text, year, position = "bottom" }) {
  const label = text ?? "Catholic Media Association";
  const phrase = year ? `${label} • ${year}` : label;
  const slots = Array.from({ length: ITEMS }, () => phrase);
  const marquee = [...slots, ...slots];

  return (
    <div className={`winnerTicker winnerTicker--${position}`} aria-hidden="true">
      <div className="winnerTicker__track">
        {marquee.map((item, index) => (
          <span className="winnerTicker__item" key={`${item}-${index}`}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
