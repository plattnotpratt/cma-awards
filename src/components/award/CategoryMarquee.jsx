import { useRef } from "react";
import { gsap, useGSAP, SplitText } from "../../utils/gsap";

export default function CategoryMarquee({ category, year, path }) {
  const marqueeRef = useRef(null);
  useGSAP(() => {
    if (!marqueeRef.current) return;
    const title = marqueeRef.current.querySelector(".categoryMarquee__title");
    if (!title) return;
    const split = new SplitText(title, { type: "words" });
    const tween = gsap.from(split.words, {
      opacity: 0,
      y: 40,
      duration: 1,
      ease: "power4.out",
      stagger: 0.1,
      onComplete: () => split.revert(),
    });
    return () => {
      tween?.kill();
      split.revert();
    };
  }, { scope: marqueeRef });

  return (
    <div className="categoryMarquee" ref={marqueeRef}>
      <div className="categoryMarquee__eyebrow">
        {year ? `Year ${year}` : "Award Category"}
      </div>
      <h1 className="categoryMarquee__title">
        {category ?? "Category unavailable"}
      </h1>
      {path ? <div className="categoryMarquee__path">{path}</div> : null}
    </div>
  );
}
