import React, {useState, useEffect} from 'react';
import './task-input.scss';
import {Property} from 'csstype';

export interface TaskInputStyle {
    width?: string;
    padding?: string;
    textAlign?: Property.TextAlign;
    fontWeight?: string;
    height?: string;
    maxHeight?: string;
    lineHeight?: string;
}

interface Props {
    initValue: string;
    maxCharacterCount?: number;
    regexAllow?: string;
    style?: TaskInputStyle;
    setValue?(val: string): void;
}

function TaskInput(props: Props) {
    const [isEdit, setEdit] = useState(false);
    const [currentValue, setCurrentValue] = useState("");

    useEffect(()=>setCurrentValue(props.initValue), [isEdit]);
    useEffect(()=>setCurrentValue(props.initValue), [props.initValue]);

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
                    const val = e.target.value;
                    if(val === "") {
                        setCurrentValue(val);
                        return;
                    }

                    if(props.regexAllow !== undefined) {
                        const re = new RegExp(props.regexAllow);
                        const matches = val.match(re);
                        if(matches === null || matches.length !== 1) {
                            return;
                        }
                        if(matches[0] !== val) {
                            return;
                        }
                    }
                    if(props.maxCharacterCount !== undefined && val.length > props.maxCharacterCount) {
                        return;
                    }
                    setCurrentValue(val)
                }}
                onBlur={()=>{
                    closeInput();
                    if(props.setValue) {
                        props.setValue(currentValue);
                    }
                }}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>)=>{
                    if(e.key === "Enter") {
                        closeInput();
                        if(props.setValue) {
                            props.setValue(currentValue);
                        }
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
        <div tabIndex={0} style={props.style} className="task-input" onClick={openInput} onFocus={openInput}>
            {props.initValue}
        </div>
    );
}

export default TaskInput;

