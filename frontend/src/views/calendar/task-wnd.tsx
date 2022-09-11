import React, {KeyboardEvent, useEffect, useState, useReducer} from 'react';
import TaskInput, {TaskInputStyle} from './task-input';
import TaskTextArea from './task-text-area';
import {useStore, useDispatch} from 'react-redux';
import {TaskState} from '../../store/tasks';
import './task-wnd.scss';

interface Props {
    id: string | undefined;
    date: Date | undefined;
    startTime: string | undefined;
    endTime: string | undefined;
    show: boolean;

    hide(): void;
}

function createDefaultTaskState(props: Props): TaskState {
    const isoDate = (props.date === undefined) ?  undefined : props.date.toISOString().split("T").at(0) as string | undefined;

    return {
        id: (props.id === undefined) ? "" : props.id,
        day: (isoDate === undefined) ? "" : isoDate,
        startTime: (props.startTime === undefined) ? "" : props.startTime,
        endTime: (props.endTime === undefined) ? "" : props.endTime,
        basicInfo: "",
        description: "",
        category: ""
    };
}

function parseStringToFixedNumber(val: string, pos: number): string {
    const splits = val.split(":");
    if(splits.length !== 2 || isNaN(Number(splits[pos]))) {
        return "00";
    }
    const num = parseInt(splits[pos]);
    return (num < 10) ? `0${num}` : num.toFixed();
}

function getStartHour(task: TaskState): string {
    if(task.startTime === undefined) {
        return "00";
    }
    return parseStringToFixedNumber(task.startTime, 0);
}

function getStartMinute(task: TaskState): string {
    if(task.startTime === undefined) {
        return "00";
    }
    return parseStringToFixedNumber(task.startTime, 1);
}

function getEndHour(task: TaskState): string {
    if(task.endTime === undefined) {
        return "00";
    }
    return parseStringToFixedNumber(task.endTime, 0);
}

function getEndMinute(task: TaskState): string {
    if(task.endTime === undefined) {
        return "00";
    }
    return parseStringToFixedNumber(task.endTime, 1);
}

function replaceFixedNumberInTimeString(timeStr: string, newValue: string, pos: number): string {
    const splits = timeStr.split(":");
    if(splits.length !== 2) {
        return "00:00";
    }
    splits[pos] = newValue;
    return splits.join(":");
}

function setNewStartHour(task: TaskState, startHour: string): string {
    if(task.startTime === undefined) {
        return "00:00";
    }
    return replaceFixedNumberInTimeString(task.startTime, startHour, 0);
}

function setNewStartMinute(task: TaskState, startMinute: string): string {
    if(task.startTime === undefined) {
        return "00:00";
    }
    return replaceFixedNumberInTimeString(task.startTime, startMinute, 1);
}

function setNewEndHour(task: TaskState, endHour: string): string {
    if(task.endTime === undefined) {
        return "00:00";
    }
    return replaceFixedNumberInTimeString(task.endTime, endHour, 0);
}

function setNewEndMinute(task: TaskState, endMinute: string): string {
    if(task.endTime === undefined) {
        return "00:00";
    }
    return replaceFixedNumberInTimeString(task.endTime, endMinute, 1);
}

function TaskWnd(props: Props) {
    const [task, setTask] = useState(createDefaultTaskState(props));
    const [isInitialized, init] = useState(false);
    const store = useStore();
    const dispatch = useDispatch();

    useEffect(()=>{
        window.addEventListener('keydown', hideWindowEvent);
        return ()=>{
            window.removeEventListener('keydown', hideWindowEvent);
        };
    });

    useEffect(()=>{
        setTask(createDefaultTaskState(props));
    }, [props.id, props.date, props.startTime, props.endTime]);

    const hideWindowEvent = (ev: globalThis.KeyboardEvent)=>{
        if(!props.show) { return; }
        if(ev.key === "Escape") {
            props.hide();
        }
    }

    const timeInputStyle = {
        width: "1.75rem",
        textAlign: "center"
    } as TaskInputStyle;

    if(!props.show) {
        return (<></>);
    }

    return (
        <>
            <div className="bckg-diffusion" onClick={()=>props.hide()}/>
            <div className="task-wnd">
                <div className="task-line-container">
                    <TaskInput style={{width: "100%", padding: "0 0.5rem"}} initValue={task.basicInfo} 
                        setValue={(val: string)=>setTask({...task, basicInfo: val})} 
                    />
                </div>
                <div className="task-line-container">
                    <div style={{margin: "0 0.5rem"}}><b>time:</b></div>
                    <TaskInput style={timeInputStyle} initValue={getStartHour(task)} maxCharacterCount={2}
                        setValue={(val: string)=>{
                            setTask({...task, startTime: setNewStartHour(task, val)});
                        }}
                    />
                    <div>:</div>
                    <TaskInput style={timeInputStyle} initValue={getStartMinute(task)} maxCharacterCount={2}
                        setValue={(val: string)=>{
                            setTask({...task, startTime: setNewStartMinute(task, val)});
                        }}
                    />
                    <div style={{margin: "0 0.25rem"}}>-</div>
                    <TaskInput style={timeInputStyle} initValue={getEndHour(task)} maxCharacterCount={2}
                        setValue={(val: string)=>{
                            setTask({...task, startTime: setNewEndHour(task, val)});
                        }}
                    />
                    <div>:</div>
                    <TaskInput style={timeInputStyle} initValue={getEndMinute(task)} maxCharacterCount={2}
                        setValue={(val: string)=>{
                            setTask({...task, startTime: setNewEndMinute(task, val)});
                        }}
                    />
                </div>
                <div className="task-extended-container">
                    <TaskTextArea initValue={task.description} setValue={(val: string)=>{
                        setTask({...task, description: val});
                    }}/>
                </div>
            </div>
        </>
    )
}

export default TaskWnd;

