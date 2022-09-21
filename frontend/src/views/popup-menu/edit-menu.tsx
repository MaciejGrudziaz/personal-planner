import React, {useState, useEffect, useRef, RefObject} from 'react';
import {Position} from '../calendar/task';
import './edit-menu.scss';

interface Props {
    x: number;
    y: number;
    edit?: ()=>void;
    delete?: ()=>void;
    close?: ()=>void;
}

function EditMenu(props: Props) {
    const [pos, setPos] = useState(undefined as Position | undefined);
    const menuRef = useRef() as RefObject<HTMLDivElement>;
    const [isInitialized, setInit] = useState(false);

    useEffect(()=>{
        if(isInitialized) { return; }
        const adjustPos = (x: number, y: number, width?: number, height?: number): Position | undefined => {
            const el = menuRef.current;
            if(el === undefined || el === null) {
                return undefined;
            }
            let adjustedPos = new Position(x, y);
            if(width === undefined || height === undefined) {
                return adjustedPos;
            }
            const boundingRect = el.getBoundingClientRect();
            if(x + boundingRect.width > width) {
                adjustedPos.x -= x + 1.1 * boundingRect.width - width;
            }
            if(y + boundingRect.height > height) {
                adjustedPos.y -= y + 1.1 * boundingRect.height - height;
            }
            return adjustedPos;
        }
        const newPos = adjustPos(props.x, props.y, window.innerWidth, window.innerHeight);
        if(newPos === undefined) { return; }
        setInit(true);
        setPos(newPos);
    });

    useEffect(()=>{
        window.addEventListener('keydown', closeMenuEvent);
        return ()=>{
            window.removeEventListener('keydown', closeMenuEvent);
        };
    });

    const closeMenuEvent = (ev: globalThis.KeyboardEvent)=>{
        if(ev.key === "Escape") {
            if(props.close) props.close();
        }
    }

    return (
        <>
            <div className="edit-menu-bckg" onMouseDown={()=>{
                if(props.close)  props.close();
            }}/>
            <div ref={menuRef} className="edit-menu" style={{top: (pos) ? pos.y : props.y, left: (pos) ? pos.x : props.x}}>
                <button type="button" className="edit-menu-btn" onClick={()=>{
                    if(props.edit) props.edit();
                    if(props.close) props.close();
                }}>edit</button>
                <button type="button" className="edit-menu-btn" onClick={()=>{
                    if(props.delete) props.delete();
                    if(props.close) props.close();
                }}>delete</button>
                <button type="button" className="edit-menu-btn" onClick={()=>{
                    if(props.close) props.close();
                }}>cancel</button>
            </div>
        </>
    );
}

export default EditMenu;

