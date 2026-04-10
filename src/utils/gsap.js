import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { SplitText } from "gsap/SplitText";

let registered = false;

if (!registered) {
  gsap.registerPlugin(useGSAP, SplitText);
  registered = true;
}

export { gsap, useGSAP, SplitText };
