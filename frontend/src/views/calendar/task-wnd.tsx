import React, {KeyboardEvent, useEffect, useState, useReducer, useRef, RefObject} from 'react';
import TaskInput, {TaskInputStyle} from './task-input';
import TaskTextArea from './task-text-area';
import CalendarMonthView from './month-view/month-view';
import {useStore, useDispatch} from 'react-redux';
import {TaskState, TaskDate, TaskTime, TaskCategory, parseDateToBuiltin, parseDateToStr, updateTask} from '../../store/tasks';
import './task-wnd.scss';

interface Props {
    id: string | undefined;
    date: TaskDate | undefined;
    startTime: TaskTime | undefined;
    endTime: TaskTime | undefined;
    basicInfo: string | undefined;
    description: string | undefined;
    show: boolean;

    hide(): void;
    save(): void;
}

function createDefaultTaskState(props: Props): TaskState {
    const now = new Date(Date.now());
    return {
        id: (props.id === undefined) ? "" : props.id,
        date: (props.date === undefined) ? {year: now.getFullYear(), month: now.getMonth(), day: now.getDate()} : props.date,
        startTime: (props.startTime === undefined) ? {hour: 0, minute: 0} : props.startTime,
        endTime: (props.endTime === undefined) ? {hour: 0, minute: 0} : props.endTime,
        basicInfo: (props.basicInfo === undefined) ? "" : props.basicInfo,
        description: (props.description === undefined) ? "" : props.description,
        category: {value: "simple"}
    };
}

function parseStringToFixedNumber(val: string): number | undefined {
    const num = parseInt(val);
    return isNaN(num) ? undefined : num;
}

function parseNumberToFixedLengthString(val: number): string {
    if(val < 0 || val > 99) {
        throw "This method only supports values in range [0, 99]";
    }
    return (val < 10) ? `0${val.toFixed()}` : val.toFixed();
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

    const timeInputStyle = {
        width: "1.75rem",
        textAlign: "center"
    } as TaskInputStyle;

    useEffect(()=>{
        window.addEventListener('keydown', hideWindowEvent);
        return ()=>{
            window.removeEventListener('keydown', hideWindowEvent);
        };
    });

    useEffect(()=>{
        if(!props.show) {
            hideCalendar();
        }
    }, [props.show]);

    useEffect(()=>{
        setTask(createDefaultTaskState(props));
    }, [props.id, props.date, props.startTime, props.endTime]);

    const hideWindowEvent = (ev: globalThis.KeyboardEvent)=>{
        if(!props.show) { return; }
        if(ev.key === "Escape") {
            if(showCalendar) {
                hideCalendar();
                return;
            }
            hideWindow();
        }
    }

    const toggleCalendar = (e: React.MouseEvent<HTMLDivElement>) => {
        setShowCalendar(!showCalendar);
        e.stopPropagation();
    }

    const hideWindow = ()=>{
        props.hide();
        hideCalendar();
    }

    const hideCalendar = ()=>{
        setShowCalendar(false);
    }

    const openCalendar = ()=>{
        setShowCalendar(true);
    }

    const saveTask = ()=>{
        dispatch(updateTask(task));
        props.save();
        hideWindow();
    }

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
                    hideCalendar();
                }}
            />
        );
    }

    if(!props.show) {
        return (<></>);
    }

    return (
        <>
            <div className="bckg-diffusion" onClick={hideWindow}/>
            <div className="task-wnd" onClick={hideCalendar}>
                <div className="task-line-container">
                    <TaskInput style={{width: "100%", padding: "0 0.5rem"}} initValue={task.basicInfo} 
                        setValue={(val: string)=>setTask({...task, basicInfo: val})} 
                    />
                </div>
                <div className="task-line-container">
                    <div style={{margin: "0 0.5rem"}}><b>time:</b></div>
                    <TaskInput style={timeInputStyle} initValue={parseNumberToFixedLengthString(task.startTime.hour)} maxCharacterCount={2}
                        setValue={(val: string)=>{
                            setTask({...task, startTime: setNewStartHour(task, val)});
                        }}
                    />
                    <div>:</div> <TaskInput style={timeInputStyle} initValue={parseNumberToFixedLengthString(task.startTime.minute)} maxCharacterCount={2}
                        setValue={(val: string)=>{
                            setTask({...task, startTime: setNewStartMinute(task, val)});
                        }}
                    />
                    <div style={{margin: "0 0.25rem"}}>-</div>
                    <TaskInput style={timeInputStyle} initValue={parseNumberToFixedLengthString(task.endTime.hour)} maxCharacterCount={2}
                        setValue={(val: string)=>{
                            setTask({...task, endTime: setNewEndHour(task, val)});
                        }}
                    />
                    <div>:</div>
                    <TaskInput style={timeInputStyle} initValue={parseNumberToFixedLengthString(task.endTime.minute)} maxCharacterCount={2}
                        setValue={(val: string)=>{
                            setTask({...task, endTime: setNewEndMinute(task, val)});
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
                <div className="task-line-container">
                    <button className="task-action-btn"
                        onClick={()=>{
                            task.category = {value: "simple"};
                            saveTask();
                        }
                    }>save</button>
                    <button className="task-action-btn" onClick={hideWindow}>cancel</button>
                </div>
            </div>
        </>
    )
}

export default TaskWnd;

