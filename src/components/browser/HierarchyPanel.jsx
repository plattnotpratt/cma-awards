import { useEffect, useRef } from "react";

export default function HierarchyPanel({
  title,
  items,
  activeValue,
  onSelect,
  emptyLabel,
  getCountLabel,
  compact = false,
  scrollable = false,
  panelRef = null,
  style = undefined,
}) {
  const activeItemRef = useRef(null);

  useEffect(() => {
    if (!scrollable || !activeItemRef.current) return;

    activeItemRef.current.scrollIntoView({
      block: "nearest",
      inline: "nearest",
      behavior: "smooth",
    });
  }, [activeValue, scrollable]);

  return (
    <section
      ref={panelRef}
      style={style}
      className={`browserPanel card${compact ? " browserPanel--compact" : ""}${scrollable ? " browserPanel--scrollable" : ""}`}
    >
      <div className="browserPanel__header">
        <h2>{title}</h2>
        <span className="browserPanel__count">{items.length}</span>
      </div>

      {items.length === 0 ? (
        <p className="muted">{emptyLabel}</p>
      ) : (
        <div className={`browserList${scrollable ? " browserList--scrollable" : ""}`}>
          {items.map((item) => {
            const isActive = item.name === activeValue;
            return (
              <button
                key={item.name}
                type="button"
                ref={isActive ? activeItemRef : null}
                className={`browserList__item${isActive ? " browserList__item--active" : ""}`}
                onClick={() => onSelect(item.name)}
              >
                <span>{item.name}</span>
                <span className="browserList__meta">{getCountLabel(item)}</span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
