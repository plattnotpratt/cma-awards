import { useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

function resultTone(type) {
  if (type === "first_place") return "resultBadge--gold";
  if (type === "second_place") return "resultBadge--silver";
  if (type === "third_place") return "resultBadge--bronze";
  if (type === "honorable_mention") return "resultBadge--mention";
  return "resultBadge--neutral";
}

function AwardResultLink({ award }) {
  const viewportRef = useRef(null);
  const titleRef = useRef(null);
  const resetTimerRef = useRef(null);
  const [marqueeDistance, setMarqueeDistance] = useState(0);
  const [marqueePhase, setMarqueePhase] = useState("idle");

  useLayoutEffect(() => {
    function updateMarqueeDistance() {
      const viewport = viewportRef.current;
      const title = titleRef.current;
      if (!viewport || !title) return;

      const badgeReserve = window.matchMedia("(max-width: 640px)").matches ? 0 : 190;
      const visibleWidth = viewport.clientWidth - badgeReserve;
      const overflows = title.scrollWidth - visibleWidth > 8;
      const nextDistance = overflows ? Math.ceil(title.scrollWidth + 48) : 0;
      setMarqueeDistance(overflows ? nextDistance : 0);
      if (!overflows) setMarqueePhase("idle");
    }

    updateMarqueeDistance();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateMarqueeDistance);
      return () => window.removeEventListener("resize", updateMarqueeDistance);
    }

    const observer = new ResizeObserver(updateMarqueeDistance);
    if (viewportRef.current) observer.observe(viewportRef.current);
    if (titleRef.current) observer.observe(titleRef.current);

    return () => observer.disconnect();
  }, [award.entryTitle]);

  function startMarquee() {
    if (!marqueeDistance) return;
    window.clearTimeout(resetTimerRef.current);
    setMarqueePhase("active");
  }

  function stopMarquee() {
    if (!marqueeDistance || marqueePhase === "idle") return;
    setMarqueePhase("leaving");
    window.clearTimeout(resetTimerRef.current);
    resetTimerRef.current = window.setTimeout(() => setMarqueePhase("idle"), 150);
  }

  useLayoutEffect(() => {
    return () => window.clearTimeout(resetTimerRef.current);
  }, []);

  return (
    <Link
      className={`awardResultLink${marqueeDistance ? " awardResultLink--marquee" : ""} awardResultLink--${marqueePhase}`}
      to={`/awards/${encodeURIComponent(award.id)}`}
      aria-label={`View ${award.entryTitle}`}
      style={marqueeDistance ? { "--marquee-distance": `${marqueeDistance}px` } : undefined}
      onBlur={stopMarquee}
      onFocus={startMarquee}
      onMouseEnter={startMarquee}
      onMouseLeave={stopMarquee}
    >
      <span className="awardResultLink__viewport" ref={viewportRef}>
        <span className="awardResultLink__fallback">{award.entryTitle}</span>
        <span className="awardResultLink__track" aria-hidden="true">
          <span ref={titleRef}>{award.entryTitle}</span>
          <span>{award.entryTitle}</span>
        </span>
      </span>
    </Link>
  );
}

export default function AwardResultItem({ award, context = "" }) {
  const organization = award.organization && award.organization !== award.publisher ? award.organization : null;

  return (
    <li>
      <div className="browserResults__titleRow">
        <AwardResultLink award={award} />
        <span className={`resultBadge ${resultTone(award.placementType)}`}>{award.placementLabel}</span>
      </div>
      {award.author ? <div className="muted">{award.author}</div> : null}
      {organization ? <div className="muted">{organization}</div> : null}
      {context ? <div className="browserResults__context">{context}</div> : null}
      {award.publisher ? <div className="muted">{award.publisher}</div> : null}
    </li>
  );
}
