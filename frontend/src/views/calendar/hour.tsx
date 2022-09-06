import React, {RefObject, useRef, useEffect, useState} from 'react';
import { useDispatch } from 'react-redux';
import { Position } from './task';
import './hour.css';

interface Props {
    day: number;
    hour: number;
    updateRefs(refs: RefObject<HTMLDivElement>[]): void;
}

function Hour(props: Props) {
    const firsQuarterRef = useRef() as RefObject<HTMLDivElement>;
    const secondQuarterRef = useRef() as RefObject<HTMLDivElement>;
    const thirdQuarterRef = useRef() as RefObject<HTMLDivElement>;
    const fourthQuarterRef = useRef() as RefObject<HTMLDivElement>;
    const [isInitialized, setInit] = useState(false);

    useEffect(()=>{
        if(isInitialized) { return; }
        props.updateRefs([firsQuarterRef, secondQuarterRef, thirdQuarterRef, fourthQuarterRef]);
        setInit(true);
    });

    return (
        <div key={props.hour} className="hour-row">
            <div ref={firsQuarterRef} className="quarter-row"><span style={{marginLeft: "-3em"}}>{props.hour}:00</span></div>
            <div ref={secondQuarterRef} className="quarter-row"/>
            <div ref={thirdQuarterRef} className="quarter-row"/>
            <div ref={fourthQuarterRef} className="quarter-row"/>
        </div>
    );
}

export default Hour;

