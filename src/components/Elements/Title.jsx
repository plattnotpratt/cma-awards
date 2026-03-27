import React, { useRef } from "react";
import { useGSAP } from '@gsap/react';
import { SplitText } from "gsap/SplitText"
import gsap from 'gsap';

gsap.registerPlugin(useGSAP);
gsap.registerPlugin(SplitText);

export default function Title(props) {
    const title = useRef();
    useGSAP(() => {
        gsap.to(title.current.querySelectorAll('.title'), {
            // <- selector text, scoped to this component!
            yPercent: '+=100', // Increase the y position by 100%
            ease: 'expo.inOut',
        });
    }, {
        scope: title
    })
    const { entryTitle, name } = props
    return (
        <>
            <style>{style}</style>
            <header ref={title} className="word">
                <h1 className="title word-hidden">{entryTitle ?? name}</h1>
                <h1 className="title word-visible">{entryTitle ?? name}</h1>
            </header>
        </>
    );
}
const style = `
    h1{
        text-align: center;
        width: 100%;
    }
    .word{
        line-height: 0.8;
        position: relative;
        text-transform: uppercase;
        clip-path: polygon(0 2%, 0 98%, 100% 98%, 100% 2%);
    }
    .word-hidden {
        position: absolute;
        left: 0;
        top: 0;
        transform: translate(0, -100%); /* Translate it -100% of its height on the y-axis */
    }
`;