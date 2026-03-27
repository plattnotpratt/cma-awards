import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

export default function WinnerStatus(props) {
  const containerRef = useRef(null);
  const phraseRef = useRef(null);
  const { status } = props;

  useGSAP(() => {
    let wheel = 0;
    let total = 0;
    let xTo;
    let isWheeling;

    const content = containerRef.current;
    const half = phraseRef.current.clientWidth;

    const wrap = gsap.utils.wrap(-half, 0);

    xTo = gsap.quickTo(content, "x", {
      duration: 0.5,
      ease: "power3",
      modifiers: {
        x: gsap.utils.unitize(wrap),
      },
    });

    const tick = (time, dt) => {
      total -= wheel + dt / 5;
      xTo(total);
    };

    gsap.ticker.add(tick);

    const handleWheel = (e) => {
      wheel = e.deltaY;

      clearTimeout(isWheeling);
      isWheeling = setTimeout(() => {
        wheel = 0;
      }, 66);
    };

    window.addEventListener("wheel", handleWheel, { passive: true });

    // cleanup
    return () => {
      gsap.ticker.remove(tick);
      window.removeEventListener("wheel", handleWheel);
    };
  }, []);

  return (
    <>
      <style>{style}</style>
      <div className="mwg_effect013">
        <div className="container" ref={containerRef}>
          <div className="phrase" ref={phraseRef}>
            {status} | {status} | {status} | {status} |
          </div>
          <div className="phrase" ref={phraseRef}>
            {status} | {status} | {status} | {status} |
          </div>
        </div>
      </div>
    </>
  );
}

const style = `
.mwg_effect013 .inner {
    transform: rotate(-10deg);
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
}
.mwg_effect013 .container {
    display: flex;
    font-size: 160px;
    font-family: 'Inter', sans-serif;
    text-transform: uppercase;
    letter-spacing: -0.06em;
    will-change: transform;
    white-space: nowrap;
}
`;