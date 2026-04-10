import { useRef } from "react";
import { gsap, useGSAP } from "../../utils/gsap";

export default function RecipientSpotlight({ title, organization }) {
  const stageRef = useRef(null);

  useGSAP(() => {
    if (!stageRef.current) return;
    const elements = stageRef.current.querySelectorAll(".recipientSpotlight__title, .recipientSpotlight__org");
    gsap.from(elements, {
      yPercent: 30,
      opacity: 0,
      duration: 1.2,
      ease: "power3.out",
      stagger: 0.15,
    });
  }, { scope: stageRef });

  return (
    <div className="recipientSpotlight" ref={stageRef}>
      <div className="recipientSpotlight__glare" aria-hidden="true" />
      <div className="recipientSpotlight__title">{title ?? "Award entry"}</div>
      {organization ? <div className="recipientSpotlight__org">{organization}</div> : null}
    </div>
  );
}
