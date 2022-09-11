import React, {useState, useEffect} from 'react';
import './task-text-area.scss';

interface Props {
    initValue: string;
    setValue(val: string): void;
}

function TaskTextArea(props: Props) {
    const [isEdit, setEdit] = useState(false);
    const [currentValue, setCurrentValue] = useState("");

    useEffect(()=>setCurrentValue(props.initValue), [isEdit]);

    const openInput = ()=>{
        setEdit(true);
    };

    const closeInput = ()=>{
        setEdit(false);
    };

    const formatText = ()=>props.initValue.split("\n").map((line: string, id: number)=>(
        <div key={id}>{line}</div>
    ));

    if(isEdit) {
        return (
            <textarea className="task-text-area" value={currentValue} autoFocus={true}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>)=>{
                    setCurrentValue(e.target.value);
                }}
                onBlur={()=>{
                    closeInput();
                    props.setValue(currentValue);
                }}
                onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>)=>{
                    if(e.key === "Enter") {
                        if(e.shiftKey) {
                            return;
                        }
                        closeInput();
                        props.setValue(currentValue);
                        return;
                    }
                    if(e.key === "Escape") {
                        e.stopPropagation();
                        closeInput();
                        return;
                    }
                }}
            />
        );
    }

    return (
        <div className="task-text-area" onClick={()=>openInput()}>
            {formatText()}
        </div>
    );
}

export default TaskTextArea;

