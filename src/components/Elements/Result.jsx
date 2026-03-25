import React,{useRef} from "react";
import { useGSAP } from '@gsap/react';
import { SplitText } from "gsap/SplitText"
import gsap from 'gsap';

gsap.registerPlugin(useGSAP);
gsap.registerPlugin(SplitText);

export default function Result(props){
    useGSAP(() => {
        let split = SplitText.create("h3",{type: 'chars'})
        gsap.from(split.chars, {
            // <- selector text, scoped to this component!
            opacity: 0,
            y: 100,
            ease: "back",
            duration: 1,
            stagger: 0.1
        });})
    const {winnerLabel} = props;
    return (
        <>
            <style>{style}</style>
            <h3 className="result-value">{winnerLabel}</h3>
        </>
    );
}

const style = `
.result-value{
    text-align: center;
}
`;
