import React, {KeyboardEvent, useEffect, useState, useReducer, useRef, RefObject} from 'react';
import TaskInput, {TaskInputStyle} from './task-input';
import TaskTextArea from './task-text-area';
import CalendarMonthView from './month-view/month-view';
import {useStore, useDispatch} from 'react-redux';
import {TaskState, TaskDate, TaskTime, parseDateToBuiltin, parseDateToStr} from '../../store/tasks';
import './task-wnd.scss';

interface Props {
    id: string | undefined;
    date: TaskDate | undefined;
    startTime: TaskTime | undefined;
    endTime: TaskTime | undefined;
    show: boolean;

    hide(): void;
}

function createDefaultTaskState(props: Props): TaskState {
    const now = new Date(Date.now());
    return {
        id: (props.id === undefined) ? "" : props.id,
        date: (props.date === undefined) ? {year: now.getFullYear(), month: now.getMonth(), day: now.getDate()} : props.date,
        startTime: (props.startTime === undefined) ? {hour: 0, minute: 0} : props.startTime,
        endTime: (props.endTime === undefined) ? {hour: 0, minute: 0} : props.endTime,
        basicInfo: "",
        description: "",
        category: ""
    };
}

function parseStringToFixedNumber(val: string): number | undefined {
    const num = parseInt(val);
    return isNaN(num) ? undefined : num;
}

function setNewStartHour(task: TaskState, val: string): TaskTime {
    const newHour = parseStringToFixedNumber(val);
    if(newHour === undefined) { return task.startTime; }
    if(newHour === task.endTime.hour) {
        if(task.startTime.minute >= task.endTime.minute) {
            return task.startTime;
        }
        return {...task.startTime, hour: newHour};
    }
    if(newHour > task.endTime.hour) {
        return task.startTime;
    }
    return {...task.startTime, hour: newHour};
}

function setNewStartMinute(task: TaskState, val: string): TaskTime {
    const newMinute = parseStringToFixedNumber(val);
    if(newMinute === undefined) { return task.startTime; }
    if(task.startTime.hour === task.endTime.hour) {
        if(newMinute >= task.endTime.minute) {
            return task.startTime;
        }
        return {...task.startTime, minute: newMinute};
    }
    return {...task.startTime, minute: newMinute};
}

function setNewEndHour(task: TaskState, val: string): TaskTime {
    const newHour = parseStringToFixedNumber(val);
    if(newHour === undefined) { return task.endTime; }
    if(newHour === task.endTime.hour) {
        if(task.endTime.minute <= task.startTime.minute) {
            return task.endTime;
        }
        return {...task.endTime, hour: newHour};
    }
    if(newHour <= task.endTime.hour) {
        return task.endTime;
    }
    return {...task.endTime, hour: newHour};
}

function setNewEndMinute(task: TaskState, val: string): TaskTime {
    const newMinute = parseStringToFixedNumber(val);
    if(newMinute === undefined) { return task.endTime; }
    if(task.startTime.hour === task.endTime.hour) {
        if(newMinute <= task.startTime.minute) {
            return task.endTime;
        }
        return {...task.endTime, minute: newMinute};
    }
    return {...task.endTime, minute: newMinute};
}

function TaskWnd(props: Props) {
    const [task, setTask] = useState(createDefaultTaskState(props));
    const [showCalendar, setShowCalendar] = useState(false);
    const dateInputRef = useRef() as RefObject<HTMLDivElement>;
    const store = useStore();
    const dispatch = useDispatch();

    useEffect(()=>{
        window.addEventListener('keydown', hideWindowEvent);
        return ()=>{
            window.removeEventListener('keydown', hideWindowEvent);
        };
    });

    useEffect(()=>{
        if(!props.show) {
            setShowCalendar(false);
        }
    }, [props.show]);

    useEffect(()=>{
        setTask(createDefaultTaskState(props));
    }, [props.id, props.date, props.startTime, props.endTime]);

    const hideWindowEvent = (ev: globalThis.KeyboardEvent)=>{
        if(!props.show) { return; }
        if(ev.key === "Escape") {
            if(showCalendar) {
                setShowCalendar(false);
                return;
            }
            props.hide();
        }
    }

    const toggleCalendar = (e: React.MouseEvent<HTMLDivElement>) => {
        setShowCalendar(!showCalendar);
        e.stopPropagation();
    }

    const timeInputStyle = {
        width: "1.75rem",
        textAlign: "center"
    } as TaskInputStyle;

    const popupCalendar = ()=>{
        if(!showCalendar) {
            return (<></>);
        }
        const el = dateInputRef.current;
        if(el === null) {
            return (<></>);
        }

        const date = parseDateToBuiltin(task.date);
        if(date === undefined) {
            return (<></>);
        }

        return (
            <CalendarMonthView x={el.offsetLeft} y={el.offsetTop + el.offsetHeight} day={date.getDate()} month={date.getMonth()} year={date.getFullYear()} 
                selectDay={(date: number, month: number, year: number)=>{
                    setTask({...task, date: {year: year, month: month, day: date}});
                    setShowCalendar(false);
                }}
            />
        );
    }

    if(!props.show) {
        return (<></>);
    }

    return (
        <>
            <div className="bckg-diffusion" onClick={()=>props.hide()}/>
            <div className="task-wnd" onClick={()=>setShowCalendar(false)}>
                <div className="task-line-container">
                    <TaskInput style={{width: "100%", padding: "0 0.5rem"}} initValue={task.basicInfo} 
                        setValue={(val: string)=>setTask({...task, basicInfo: val})} 
                    />
                </div>
                <div className="task-line-container">
                    <div style={{margin: "0 0.5rem"}}><b>time:</b></div>
                    <TaskInput style={timeInputStyle} initValue={task.startTime.hour.toFixed()} maxCharacterCount={2}
                        setValue={(val: string)=>{
                            setTask({...task, startTime: setNewStartHour(task, val)});
                        }}
                    />
                    <div>:</div>
                    <TaskInput style={timeInputStyle} initValue={task.startTime.minute.toFixed()} maxCharacterCount={2}
                        setValue={(val: string)=>{
                            setTask({...task, startTime: setNewStartMinute(task, val)});
                        }}
                    />
                    <div style={{margin: "0 0.25rem"}}>-</div>
                    <TaskInput style={timeInputStyle} initValue={task.endTime.hour.toFixed()} maxCharacterCount={2}
                        setValue={(val: string)=>{
                            setTask({...task, startTime: setNewEndHour(task, val)});
                        }}
                    />
                    <div>:</div>
                    <TaskInput style={timeInputStyle} initValue={task.endTime.minute.toFixed()} maxCharacterCount={2}
                        setValue={(val: string)=>{
                            setTask({...task, startTime: setNewEndMinute(task, val)});
                        }}
                    />
                </div>
                <div className="task-line-container">
                    <div style={{margin: "0 0.5rem"}}><b>date:</b></div>
                    <div ref={dateInputRef} onClick={toggleCalendar} className="task-date">{parseDateToStr(task.date)}</div>
                </div>
                {popupCalendar()}
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

