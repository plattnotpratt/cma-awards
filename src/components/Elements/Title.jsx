import React,{useRef} from "react";
import { useGSAP } from '@gsap/react';
import { SplitText } from "gsap/SplitText"
import gsap from 'gsap';

gsap.registerPlugin(useGSAP);
gsap.registerPlugin(SplitText);

export default function Title(props){
    const title = useRef();
    useGSAP(() => {
        let split = SplitText.create("h1",{type: 'chars'})
        gsap.from(split.chars, {
            // <- selector text, scoped to this component!
            opacity: 0,
            y: 100,
            ease: "back",
            duration: 1,
            stagger: 0.1
        });},{ 
            scope: title 
    })
    const {entryTitle, name, description } = props
    return (
        <>
            <style>{style}</style>
            <header ref={title} className="header">
                <h1 className="title word">{entryTitle ?? name}</h1>
                {description ? (<p className="muted">{description}</p>) : null}
            </header>
        </>
    );
}
const style = `
h1.title{
    text-align: center;
}
`;