import React, {useState, useEffect, ChangeEvent} from 'react';
import './floating-text-input.scss';

interface Props {
    x: number;
    y: number;
    width?: string;
    marginLeft?: string;
    marginRight?: string;
    close?: ()=>void;
    save?: (val: string)=>void;
}

function FloatingTextInput(props: Props) {
    const [value, setValue] = useState("");

    return (
        <input value={value} autoFocus={true} className="floating-text-input" 
            style={{left: props.x, top: props.y, width: (props.width) ? props.width : "100%", marginLeft: props.marginLeft, marginRight: props.marginRight}}
            onChange={(e: ChangeEvent<HTMLInputElement>)=>{
                setValue(e.target.value);
            }}
            onBlur={()=>{
                if(props.close) props.close();
            }}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>)=>{
                if(e.key === "Escape" || e.key === "Tab") {
                    if(props.close) props.close();
                    return;
                }
                if(e.key === "Enter") {
                    if(props.save) props.save(value);
                    if(props.close) props.close();
                    return;
                }
            }}
        />
    );
}

export default FloatingTextInput;

