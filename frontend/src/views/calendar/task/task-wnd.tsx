import React, {KeyboardEvent, useEffect, useState, useReducer, useRef, RefObject} from 'react';
import TaskInput, {TaskInputStyle} from './task-input';
import TaskTextArea from './task-text-area';
import CalendarMonthView from './../month-view/month-view';
import TaskDropdownSelect from './task-dropdown-select';
import {TaskState, TaskDate, TaskTime, parseDateToBuiltin, parseDateToStr, TaskRepetition, RepetitionType} from '../../../store/tasks';
import {useUpdateTask} from '../../../gql-client/tasks/update';
import {useCreateTask} from '../../../gql-client/tasks/create';
import {useDeleteTask} from '../../../gql-client/tasks/delete';
import './task-wnd.scss';
import {useStore} from 'react-redux';
import {Category} from '../../../store/categories';
import {RootState} from '../../../store/store';

interface Props {
    id: string | undefined;
    date: TaskDate | undefined;
    startTime: TaskTime | undefined;
    endTime: TaskTime | undefined;
    basicInfo: string | undefined;
    description: string | undefined;
    category: string | undefined;
    repetition: TaskRepetition | undefined;
    show: boolean;

    hide(): void;
    save(task: TaskState): void;
}

function createDefaultTaskState(props: Props): TaskState {
    const now = new Date(Date.now());
    return {
        id: (props.id === undefined) ? "" : props.id,
        date: (props.date === undefined) ? {year: now.getFullYear(), month: now.getMonth(), day: now.getDate()} : props.date,
        startTime: (props.startTime === undefined) ? undefined : props.startTime,
        endTime: (props.endTime === undefined) ? undefined : props.endTime,
        basicInfo: (props.basicInfo === undefined) ? "" : props.basicInfo,
        description: (props.description === undefined) ? "" : props.description,
        category: props.category,
        repetition: props.repetition
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

function setNewStartHour(task: TaskState, val: string): TaskTime | undefined {
    if(task.startTime === undefined) { return undefined; }
    const newHour = parseStringToFixedNumber(val);
    if(newHour === undefined) { return task.startTime; }
    if(task.endTime === undefined) { return {...task.startTime, hour: newHour}; }
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

function setNewStartMinute(task: TaskState, val: string): TaskTime | undefined {
    if(task.startTime === undefined) { return undefined; }
    const newMinute = parseStringToFixedNumber(val);
    if(newMinute === undefined) { return task.startTime; }
    if(task.endTime === undefined) { return {...task.startTime, minute: newMinute} };
    if(task.startTime.hour === task.endTime.hour) {
        if(newMinute >= task.endTime.minute) {
            return task.startTime;
        }
        return {...task.startTime, minute: newMinute};
    }
    return {...task.startTime, minute: newMinute};
}

function setNewEndHour(task: TaskState, val: string): TaskTime | undefined {
    if(task.endTime === undefined) { return undefined; }
    const newHour = parseStringToFixedNumber(val);
    if(newHour === undefined) { return task.endTime; }
    if(task.startTime === undefined) { return {...task.endTime, hour: newHour}; }
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

function setNewEndMinute(task: TaskState, val: string): TaskTime | undefined {
    if(task.endTime === undefined) { return undefined; }
    const newMinute = parseStringToFixedNumber(val);
    if(newMinute === undefined) { return task.endTime; }
    if(task.startTime === undefined) { return {...task.endTime, minute: newMinute}; }
    if(task.startTime.hour === task.endTime.hour) {
        if(newMinute <= task.startTime.minute) {
            return task.endTime;
        }
        return {...task.endTime, minute: newMinute};
    }
    return {...task.endTime, minute: newMinute};
}

function TaskWnd(props: Props) {
    const updateTask = useUpdateTask();
    const createTask = useCreateTask();
    const deleteTask = useDeleteTask();
    const [task, setTask] = useState(createDefaultTaskState(props));
    const [showCalendar, setShowCalendar] = useState(props.startTime === undefined || props.endTime === undefined);
    const [showRepetitionDateCalendar, setShowRepetitionDateCalendar] = useState(false);
    const [categories, setCategories] = useState([] as Category[]);
    const store = useStore();
    const dateInputRef = useRef() as RefObject<HTMLDivElement>;
    const repetitionDateInputRef = useRef() as RefObject<HTMLDivElement>;

    const timeInputStyle = {
        width: "1.75rem",
        textAlign: "center"
    } as TaskInputStyle;

    const repetitionOptions = ["days", "weeks", "months", "years", "day of the week"];
    const categoriesNames = categories.map((val: Category) => val.name);

    const mapRepetitionOptionsToRepetitionType = (option: string): RepetitionType | undefined => {
        switch(option) {
            case "days":
                return "daily";
            case "weeks":
                return "weekly";
            case "months":
                return "monthly";
            case "years":
                return "yearly";
            case "day of the week":
                return "day-of-week";
            default:
                return undefined;
        }
    }

    const mapRepetitionTypeToOptionType = (type: RepetitionType): string => {
        switch(type) {
            case "daily":
                return repetitionOptions[0];
            case "weekly":
                return repetitionOptions[1];
            case "monthly":
                return repetitionOptions[2];
            case "yearly":
                return repetitionOptions[3];
            case "day-of-week":
                return repetitionOptions[4];
        }
    }

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
        fetchCategories();
        store.subscribe(fetchCategories);
    }, [props.show]);

    useEffect(()=>{
        setTask(createDefaultTaskState(props));
    }, [props.id, props.date, props.startTime, props.endTime]);

    const fetchCategories = () => {
        setCategories((store.getState() as RootState).categoryState);
    }

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

    const toggleRepetitionDateCalendar = (e: React.MouseEvent<HTMLDivElement>) => {
        setShowRepetitionDateCalendar(!showRepetitionDateCalendar);
        e.stopPropagation();
    }

    const hideWindow = ()=>{
        props.hide();
        hideCalendar();
    }

    const hideCalendar = ()=>{
        setShowCalendar(false);
        setShowRepetitionDateCalendar(false);
    }

    const saveTask = ()=>{
        if(task.id === "") {
            if(task.category === undefined && categoriesNames.length > 0) {
                task.category = categoriesNames[0];
            }
        }
        props.save(task);
        hideWindow();
    }

    const popupCalendar = (ref: RefObject<HTMLDivElement>, isCalendarVisible: ()=>boolean, fetchDate: ()=>TaskDate|undefined, callback: (date: TaskDate)=>void)=>{
        if(!isCalendarVisible()) {
            return (<></>);
        }
        const el = ref.current;
        if(el === null) {
            return (<></>);
        }

        const taskDate = fetchDate();
        const date = (taskDate === undefined) ? undefined : parseDateToBuiltin(taskDate);
        if(date === undefined) {
            return (<></>);
        }

        return (
            <CalendarMonthView x={el.offsetLeft} y={el.offsetTop + el.offsetHeight} day={date.getDate()} month={date.getMonth()} year={date.getFullYear()}
                selectDay={(date: number, month: number, year: number)=>{
                    callback({year: year, month: month, day: date});
                    hideCalendar();
                }}
            />
        );
    }

    if(!props.show) {
        return (<></>);
    }

    const timeInputFullDayCheckbox = (
        <>
            <input type="checkbox"
                style={{margin: "auto 0.5rem auto 1rem"}}
                checked={task.startTime === undefined || task.endTime === undefined}
                onChange={()=>{
                    if(task.startTime === undefined || task.endTime === undefined) {
                        setTask({...task, startTime: {hour: 12, minute: 0}, endTime: {hour: 13, minute: 0}});
                        return;
                    }
                    setTask({...task, startTime: undefined, endTime: undefined});
                }}
            />
            <span>full day</span>
        </>
    )

    const timeInput = () => {
        if(task.startTime === undefined || task.endTime === undefined) {
            return (
                <div className="task-line-container">
                    <div style={{margin: "0 0.5rem"}}><b>time:</b></div>
                    {timeInputFullDayCheckbox}
                </div>
            );
        }
        return (
            <div className="task-line-container">
                <div style={{margin: "0 0.5rem"}}><b>time:</b></div>
                <TaskInput style={timeInputStyle} initValue={parseNumberToFixedLengthString(task.startTime.hour)} maxCharacterCount={2} regexAllow={'\\d+'}
                    setValue={(val: string)=>{
                        setTask({...task, startTime: setNewStartHour(task, val)});
                    }}
                />
                <div>:</div> <TaskInput style={timeInputStyle} initValue={parseNumberToFixedLengthString(task.startTime.minute)} maxCharacterCount={2} regexAllow={'\\d+'}
                    setValue={(val: string)=>{
                        setTask({...task, startTime: setNewStartMinute(task, val)});
                    }}
                />
                <div style={{margin: "0 0.25rem"}}>-</div>
                <TaskInput style={timeInputStyle} initValue={parseNumberToFixedLengthString(task.endTime.hour)} maxCharacterCount={2} regexAllow={'\\d+'}
                    setValue={(val: string)=>{
                        setTask({...task, endTime: setNewEndHour(task, val)});
                    }}
                />
                <div>:</div>
                <TaskInput style={timeInputStyle} initValue={parseNumberToFixedLengthString(task.endTime.minute)} maxCharacterCount={2} regexAllow={'\\d+'}
                    setValue={(val: string)=>{
                        setTask({...task, endTime: setNewEndMinute(task, val)});
                    }}
                />
                {timeInputFullDayCheckbox}
            </div>
        );
    };

    const repetitionCheckbox = (
        <div className="task-line-container">
            <div style={{margin: "0 0.5rem"}}><b>repeat event:</b></div>
            <input type="checkbox"
                style={{margin: "auto 0.5rem auto 1rem"}}
                checked={task.repetition !== undefined}
                onChange={() => {
                    if(task.repetition !== undefined) {
                        setTask({...task, repetition: undefined});
                        return;
                    }
                    setTask({...task, repetition: {type: "daily", count: 1, endDate: undefined}});
                }}
            />
        </div>
    );

    const repetitionDateCheckbox = () => {
        if(task.repetition === undefined) {
            return (<></>);
        }
        return (
            <input type="checkbox"
                style={{margin: "auto 0.5rem"}}
                checked={task.repetition.endDate !== undefined}
                onChange={() => {
                    if(task.repetition === undefined) {
                        return;
                    }
                    if(task.repetition.endDate === undefined) {
                        setTask({...task, repetition: {...task.repetition, endDate: task.date}});
                        return;
                    }
                    setTask({...task, repetition: {...task.repetition, endDate: undefined}});
                }}
            />
        );
    }

    const repetitionEndDate = () => {
        if(task.repetition === undefined) {
            return (<></>);
        }
        if(task.repetition.endDate === undefined) {
            return (
                <>
                    <span style={{margin: "0 0.5rem"}}>, end date: <b style={{marginLeft: "0.5rem"}}>never</b></span>
                    {repetitionDateCheckbox()}
                </>
            );
        }
        return (
            <>
                <span style={{margin: "0 0.5rem"}}>, end date: </span>
                <div ref={repetitionDateInputRef} onClick={toggleRepetitionDateCalendar} className="task-date">{parseDateToStr(task.repetition.endDate)}</div>
                {popupCalendar(repetitionDateInputRef, 
                    () => showRepetitionDateCalendar, 
                    () => (task.repetition === undefined) ? undefined : task.repetition.endDate,
                    (date: TaskDate) => {
                        if(task.repetition === undefined) return;
                        setTask({...task, repetition: {...task.repetition, endDate: date}});
                    }
                )}
                {repetitionDateCheckbox()}
            </>
        );
    };

    const repetitionCountDayOfTheWeekInput = () => {
        const isChecked = (index: number) => {
            if(task.repetition === undefined) {
                return false;
            }
            return (task.repetition.count >> index) % 2 === 1;
        }

        const days = ["mon","tue","wed","thu","fri","sat","sun"].map((day: string, index: number) => (
            <div key={index} className="task-repetition-input-day"
                style={{backgroundColor: (isChecked(index)) ? "#00bbf9" : undefined}}
                onClick={()=>{
                    if(task.repetition === undefined) {
                        return;
                    }
                    const mask = 1 << index;
                    setTask({...task, repetition: {...task.repetition, count: task.repetition.count ^ mask}});
                }}
            >{day}</div>
        ));
        return (
            <div className="task-repetition-day-of-the-week-container">
                {days}
            </div>
        );
    };

    const repetitionCountInput = () => {
        if(task.repetition === undefined) {
            return (<></>);
        }

        if(task.repetition.type === "day-of-week") {
            return repetitionCountDayOfTheWeekInput();
        }

        return (
            <TaskInput style={{width: "2rem", textAlign: "center"}} initValue={task.repetition.count.toFixed()} regexAllow={'\\d+'}
                setValue={(val: string)=>{
                    if(task.repetition === undefined) {
                        return;
                    }
                    if(val === "") {
                        setTask({...task, repetition: {...task.repetition, count: 1}});
                        return;
                    }
                    const num = Number.parseInt(val);
                    if(isNaN(num)) {
                        return;
                    }
                    setTask({...task, repetition: {...task.repetition, count: num}});
                }}
            />
        );
    }

    const repetitionInput = () => {
        if(task.repetition === undefined) {
            return repetitionCheckbox;
        }
        return (
            <>
                {repetitionCheckbox}
                <div className="task-line-container">
                    <span style={{margin: "0 0.5rem"}}>repeat every </span>
                    <span style={{margin: "0 0.5rem"}}>
                        {repetitionCountInput()}
                    </span>
                    <span>
                        <TaskDropdownSelect options={repetitionOptions} initValue={mapRepetitionTypeToOptionType(task.repetition.type)}
                            select={(val: string) => {
                                if(task.repetition === undefined) {
                                    return;
                                }
                                const type = mapRepetitionOptionsToRepetitionType(val);
                                if(type === undefined) {
                                    return;
                                }
                                const count = (type === "day-of-week") ? 0 : 1;
                                setTask({...task, repetition: {...task.repetition, type: type, count: count}});
                            }}
                        />
                    </span>
                    {repetitionEndDate()}
                </div>
            </>
        );
    };

    return (
        <>
            <div className="bckg-diffusion" onClick={hideWindow}/>
            <div className="task-wnd" onClick={hideCalendar}>
                <div className="task-line-container">
                    <TaskInput style={{width: "100%", padding: "0 0.5rem"}} initValue={task.basicInfo} 
                        setValue={(val: string)=>setTask({...task, basicInfo: val})} 
                    />
                </div>
                {timeInput()}
                <div className="task-line-container">
                    <div style={{margin: "0 0.5rem"}}><b>date:</b></div>
                    <div ref={dateInputRef} onClick={toggleCalendar} className="task-date">{parseDateToStr(task.date)}</div>
                </div>
                {popupCalendar(dateInputRef, ()=>showCalendar, ()=>task.date, (date: TaskDate)=>{
                    setTask({...task, date: date});
                })}
                <div className="task-line-container">
                    <TaskDropdownSelect options={categoriesNames} initValue={(task.category !== undefined) ? task.category : ""} label={"category"} 
                        select={(val: string)=>{
                            setTask({...task, category: val});
                        }}
                    />
                </div>
                {repetitionInput()}
                <div className="task-extended-container">
                    <TaskTextArea initValue={task.description} setValue={(val: string)=>{
                        setTask({...task, description: val});
                    }}/>
                </div>
                <div className="task-line-container">
                    <button className="task-action-btn"
                        onClick={()=>{
                            saveTask();
                        }
                    }>save</button>
                    <button className="task-action-btn" onClick={hideWindow}>cancel</button>
                    <button className="task-action-btn" onClick={() => {
                        deleteTask(task.id);
                        hideWindow();
                    }}>delete</button>
                </div>
            </div>
        </>
    )
}

export default TaskWnd;

