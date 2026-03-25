import React,{useRef} from "react";
import { useGSAP } from '@gsap/react';
import { SplitText } from "gsap/SplitText"
import gsap from 'gsap';

gsap.registerPlugin(useGSAP);
gsap.registerPlugin(SplitText);

export default function Category(props){
    useGSAP(() => {
        let split = SplitText.create("div.big",{type: 'chars'})
        gsap.from(split.chars, {
            // <- selector text, scoped to this component!
            opacity: 0,
            y: 100,
            ease: "back",
            duration: 1,
            stagger: 0.1
        });
    })
    const {categoryName, year} = props
    return(
        <>
            <style>{style}</style>
            <div className="stack">
                
                {categoryName ? <div className="big"><span className="year">{year ? year : "Year unavailable"}</span>: {categoryName.split(":")[1]}</div> : <div className="muted">No category</div>}
                {/* {categoryPath ? <div className="muted small">{categoryPath}</div> : null} */}
            </div>
        </>
    )
}
const style = `
.stack .big, .stack .muted{
    text-align: center;
}
`;