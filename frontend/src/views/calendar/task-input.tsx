import React, {useState, useEffect} from 'react';
import './task-input.scss';
import {Property} from 'csstype';

export interface TaskInputStyle {
    width?: string;
    padding?: string;
    textAlign?: Property.TextAlign;
}

interface Props {
    initValue: string;
    maxCharacterCount?: number;
    style?: TaskInputStyle;
    setValue(val: string): void;
}

function TaskInput(props: Props) {
    const [isEdit, setEdit] = useState(false);
    const [currentValue, setCurrentValue] = useState("");

    useEffect(()=>setCurrentValue(props.initValue), [isEdit]);

    const openInput = ()=>{
        setEdit(true);
    }

    const closeInput = ()=>{
        setEdit(false);
    }

    if(isEdit) {
        return (
            <input className="task-input" value={currentValue} autoFocus={true}
                style={props.style}
                onChange={(e: React.ChangeEvent<HTMLInputElement>)=>{
                    if(props.maxCharacterCount === undefined) {
                        setCurrentValue(e.target.value);
                        return;
                    }
                    if(e.target.value.length <= props.maxCharacterCount) {
                        setCurrentValue(e.target.value)
                    }
                }}
                onBlur={()=>{
                    closeInput();
                    props.setValue(currentValue);
                }}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>)=>{
                    if(e.key === "Enter") {
                        closeInput();
                        props.setValue(currentValue);
                    }
                    if(e.key === "Escape") {
                        e.stopPropagation();
                        closeInput();
                    }
                    if(e.key === "Tab") {
                        e.stopPropagation();
                    }
                }}
            />
        );
    }

    return (
        <div style={props.style} className="task-input" onClick={()=>openInput()}>
            {props.initValue}
        </div>
    );
}

export default TaskInput;

