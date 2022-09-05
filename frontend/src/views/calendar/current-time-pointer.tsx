import React, {useEffect} from 'react';
import {CellInfo} from './calendar';
import './current-time-pointer.css';

export interface PointerState {
    width: number;
    x: number;
    y: number;
}

interface Props {
    state: PointerState | undefined;
}

function CurrentTimePointer(props: Props) {
    useEffect(()=>{
        console.log(`redraw pointer: ${props.state}`);

    });

    const pointer = ()=>{
        if(props.state === undefined) {
            return (<></>);
        }
        return (
            <div className="time-pointer" style={{width: props.state.width, top: props.state.y, left: props.state.x}} />
        );
    }
    return (
        <>
            {pointer()}
        </>
    )
}

export default CurrentTimePointer;

