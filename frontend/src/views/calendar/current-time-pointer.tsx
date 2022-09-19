import React, {useEffect} from 'react';
import {CellInfo} from './calendar';
import './current-time-pointer.scss';

export interface PointerState {
    width: number;
    x: number;
    y: number;
    baseX: number;
    endX: number;
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
            <>
                <div className="time-pointer" style={{width: props.state.x - props.state.baseX, top: props.state.y, left: props.state.baseX, borderTopStyle: "dashed"}} />
                <div className="time-pointer" style={{width: props.state.width, top: props.state.y, left: props.state.x, borderTopWidth: "0.3rem"}} />
                <div className="time-pointer" style={{width: props.state.endX - props.state.x, top: props.state.y, left: props.state.x + props.state.width, borderTopStyle: "dashed", borderTopColor: "#aaa"}} />
            </>
        );
    }
    return (
        <>
            {pointer()}
        </>
    )
}

export default CurrentTimePointer;

