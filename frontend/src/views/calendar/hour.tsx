import React, {RefObject, useRef, useEffect, useState} from 'react';
import { useDispatch } from 'react-redux';
import { Position } from './task';
import './hour.css';

interface Props {
    day: number;
    hour: number;
    selectedCells: CellBasicInfo[];
    updateRefs(refs: RefObject<HTMLDivElement>[]): void;
    startSelection(day: number, hour: number, quarter: number): void;
    endSelection(day: number, hour: number, quarter: number): void;
    hoverOverCell(day: number, hour: number, quarter: number): void;
}

export interface CellBasicInfo {
    day: number;
    hour: number;
    quarter: number;
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

    const startSelection = (quarter: number)=>{
        props.startSelection(props.day, props.hour, quarter);
    }

    const hoverAction = (quarter: number)=>{
        props.hoverOverCell(props.day, props.hour, quarter);
    }

    const endSelection = (quarter: number)=>{
        props.endSelection(props.day, props.hour, quarter);
    }

    const isSelected = (quarter: number)=>{
        return props.selectedCells.find((value: CellBasicInfo)=>value.day === props.day && value.hour === props.hour && value.quarter === quarter) !== undefined;
    }

    return (
        <div key={props.hour} className="hour-row">
            <div ref={firsQuarterRef} className="quarter-row" onMouseDown={()=>startSelection(0)} onMouseOver={()=>hoverAction(0)} onMouseUp={()=>endSelection(0)} style={{backgroundColor: isSelected(0) ? "red" : "white"}}><span style={{marginLeft: "-3em", userSelect: "none"}}>{props.hour}:00</span></div>
            <div ref={secondQuarterRef} className="quarter-row" onMouseDown={()=>startSelection(1)} onMouseOver={()=>hoverAction(1)} onMouseUp={()=>endSelection(1)} style={{backgroundColor: isSelected(1) ? "red" : "white"}}/>
            <div ref={thirdQuarterRef} className="quarter-row" onMouseDown={()=>startSelection(2)} onMouseOver={()=>hoverAction(2)} onMouseUp={()=>endSelection(2)} style={{backgroundColor: isSelected(2) ? "red" : "white"}}/>
            <div ref={fourthQuarterRef} className="quarter-row" onMouseDown={()=>startSelection(3)} onMouseOver={()=>hoverAction(3)} onMouseUp={()=>endSelection(3)} style={{backgroundColor: isSelected(3) ? "red" : "white"}}/>
        </div>
    );
}

export default Hour;

