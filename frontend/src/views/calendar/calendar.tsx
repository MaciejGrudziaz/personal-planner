import React, {RefObject, useEffect, useState} from 'react';
import {useStore} from 'react-redux';
import {RootState} from '../../store/store';
import Day from './day';
import TaskWnd from './task/task-wnd';
import {CellBasicInfo, extractDate, extractStartTime, extractEndTime} from './hour';
import CalendarTask, {Task, Position, ResizeDir, getAbsDate} from './task/task';
import CurrentTimePointer, {PointerState} from './current-time-pointer';
import PopupMessage, {PopupMessageInfo} from '../../components/popup-message';
import {TaskState, findTasksForWeek, parseDateToBuiltin, TaskDate, TaskTime, TaskRepetition} from '../../store/tasks';
import {useFetchTasks} from '../../gql-client/tasks/fetch';
import {useUpdateTask, useUpdateSingleTask} from '../../gql-client/tasks/update';
import {useDeleteTask, useDeleteSingleTask} from '../../gql-client/tasks/delete';
import {useUpdateCalendarViewFontSize} from '../../gql-client/config/update';
import './calendar.css';

interface ResizeAction {
    state: boolean;
    direction: ResizeDir | undefined;
}

interface Props {
    weekStartDate: Date;
    changeWeek(baseDate: Date): void;
}

export interface DayCellStore {
    dailyTasksRef: CellInfo | undefined;
    hourlyRefs: Map<number, CellInfo[]>;
}

export interface CellInfo {
    day: number;
    hour?: number;
    quarter?: number;
    x: number;
    y: number;
    width: number;
    height: number;
    ref: RefObject<HTMLDivElement>;
}

function isCellDaily(cell: CellInfo): boolean {
    return cell.hour === undefined || cell.quarter === undefined;
}

function isPointInsideCell(cell: CellInfo, point: Position) {
    return point.x >= cell.x && point.x <= cell.x + cell.width
        && point.y >= cell.y && point.y <= cell.y + cell.height;
}

interface FontState {
    size: number;
    changed: boolean;
}

interface WndTaskInfo {
    id: string | undefined;
    date: TaskDate | undefined;
    startTime: TaskTime | undefined;
    endTime: TaskTime | undefined;
    basicInfo: string | undefined;
    description: string | undefined;
    category: string | undefined;
    repetition: TaskRepetition | undefined;
    show: boolean;
}

function Calendar(props: Props) {
    const gqlFetchTasks = useFetchTasks();
    const gqlUpdateTask = useUpdateTask();
    const gqlUpdateSingleTask = useUpdateSingleTask();
    const gqlDeleteTask = useDeleteTask();
    const gqlDeleteSingleTask = useDeleteSingleTask();
    const updateCalendarViewFontSize = useUpdateCalendarViewFontSize();
    const [isGrabbed, setGrabbed] = useState(false);
    const [resizeAction, setResize] = useState({state: false} as ResizeAction);
    const [startMovePos, setStartMovePos] = useState(new Position(0, 0));
    const [modifyObject, setModifyObject] = useState(undefined as string | undefined);
    const [tasks, setTasks] = useState([] as Task[]);
    const [cells, setCells] = useState(new Map() as Map<number, DayCellStore>);
    const [pointerState, setPointerState] = useState(undefined as undefined | PointerState);
    const [calendarFont, setCalendarFont] = useState({size: 12, changed: false} as FontState);
    const [selectedCells, setSelectedCells] = useState([] as CellBasicInfo[]);
    const [wndTaskInfo, setWndTaskInfo] = useState({id: undefined, date: undefined, startTime: undefined, endTime: undefined, show: false} as WndTaskInfo);
    const [popupMsgInfo, setPopupMsgInfo] = useState({msg: "", show: false} as PopupMessageInfo);
    const [isInitialized, init] = useState(false);
    const dayMapping: Map<number, string> = new Map([[0, "monday"], [1, "tuesday"], [2, "wednesday"], [3, "thursday"], [4, "friday"], [5, "saturday"], [6, "sunday"]]);

    const store = useStore();

    useEffect(()=>{
        if(isInitialized) {
            if(calendarFont.changed) {
                updateCellsInStore();
                setCalendarFont({...calendarFont, changed: false});
            }
            return; 
        }

        init(true);

        fetchTasksFromApi().then(()=>fetchTasks());
        updateCellsInStore();
        store.subscribe(storeUpdate);

        window.addEventListener('resize', updateCellsInStore);
        setTimeout(()=>updateTimePointerWithInterval(60 * 1000), 60 * 1000);
    });

    const forceRefresh = () => {
        init(false);
    }

    const storeUpdate = ()=>{
        fetchTasks();
        updateConfig();
    }

    const updateConfig = ()=>{
        const configState = (store.getState() as RootState).configState;
        if(configState.calendarMonthView.fontSize !== calendarFont.size) {
            setCalendarFont({size: configState.calendarMonthView.fontSize, changed: true});
        }
    }

    const fetchTasksFromApi = (): Promise<boolean> => {
        const start = props.weekStartDate;
        const msInDay = 1000 * 60 * 60 * 24;
        const end = new Date(start.getTime() + 6 * msInDay);
        if(start.getUTCFullYear() !== end.getUTCFullYear() || start.getUTCMonth() !== end.getUTCMonth()) {
            return gqlFetchTasks({months: [{year: start.getFullYear(), month: start.getUTCMonth() + 1}, {year: end.getUTCFullYear(), month: end.getUTCMonth() + 1}]});
        }
        return gqlFetchTasks({year: props.weekStartDate.getFullYear(), month: props.weekStartDate.getMonth() + 1});
    }

    const fetchTasks = ()=>{
        const tasksState = (store.getState() as RootState).tasksState;
        setTasks(calcOverlapping(findTasksForWeek(props.weekStartDate, tasksState).map((taskInfo: TaskState) => {
            const task = new Task(taskInfo.id, parseDateToBuiltin(taskInfo.date), taskInfo.basicInfo, taskInfo.description, taskInfo.category, taskInfo.repetition, taskInfo.startTime, taskInfo.endTime)
            task.init(cells);
            return task;
        })));
    }

    const calcOverlapping = (tasks: Task[]): Task[] => {
        const overlappedTasks = tasks.map((task: Task) => {
            const res = task.calcOverlapping(tasks);
            return {task: task, overlapping: res};
        });

        const res = overlappedTasks.map((val: {task: Task, overlapping: boolean}) => {
            return val.overlapping;
        }).reduce((prev: boolean, curr: boolean) => {
            return prev || curr;
        }, false);

        if(res === true) {
            return calcOverlapping(overlappedTasks.map((val: {task: Task, overlapping: boolean}) => val.task));
        }
        return overlappedTasks.map((val: {task: Task, overlapping: boolean}) => val.task)
    }

    const updateTasks = ()=>{
        setTasks(calcOverlapping(tasks.map((task: Task)=>{
            const oldParams = {x: task.x, y: task.y, width: task.width, height: task.height};
            task.init(cells);
            return task;
        })));
    };

    const updateCalendarFontSize = (diff: number)=>{
        const newFontSize = calendarFont.size + diff;
        updateCalendarViewFontSize({size: newFontSize});
        setCalendarFont({size: newFontSize, changed: true});
    }

    const updateDailyRef = (dailyTask: CellInfo | undefined): CellInfo | undefined => {
        if(!dailyTask) { return undefined; }
        const el = dailyTask.ref.current;
        if(el === undefined || el === null) { return dailyTask; }
        const boundingRect = el.getBoundingClientRect();
        dailyTask.x = boundingRect.x;
        dailyTask.y = boundingRect.y;
        dailyTask.width = boundingRect.width;
        dailyTask.height = boundingRect.height;
        return dailyTask;
    }

    const updateCellsInStore = ()=>{
        cells.forEach((dayStore: DayCellStore, day: number)=>{
            dayStore.dailyTasksRef = updateDailyRef(dayStore.dailyTasksRef);
            dayStore.hourlyRefs.forEach((quarters: CellInfo[], hour: number)=>{
                quarters.forEach((cell: CellInfo, quarter: number)=>{
                    const el = cell.ref.current;
                    if(el === null || el === undefined) { return; }
                    const boundingRect = el.getBoundingClientRect();
                    cell.x = boundingRect.x;
                    cell.y = boundingRect.y;
                    cell.width = boundingRect.width;
                    cell.height = boundingRect.height;
                });
            });
        });
        setCells(cells);
        updateTimePointer();
        updateTasks();
    };

    const updateTimePointer = ()=>{
        const currentDate = new Date(Date.now());
        const matchingCell = findCellByTime(currentDate);
        if(matchingCell === undefined) {
            setPointerState(undefined);
            return;
        }
        const firstDayOfTheWeekDate = props.weekStartDate;
        firstDayOfTheWeekDate.setHours(12);
        const baseCell = findCellByTime(firstDayOfTheWeekDate);
        if(baseCell === undefined) {
            setPointerState(undefined);
            return;
        }
        const lastDayOfTheWeekDate = calcDate(6);
        lastDayOfTheWeekDate.setHours(12);
        const endCell = findCellByTime(lastDayOfTheWeekDate);
        if(endCell === undefined) {
            setPointerState(undefined);
            return;
        }
        if(matchingCell.quarter === undefined) { return; }
        const verticalOffset = Math.floor((currentDate.getMinutes() - matchingCell.quarter * 15) / 15 * matchingCell.height);
        setPointerState({width: matchingCell.width, x: matchingCell.x, y: matchingCell.y + verticalOffset, baseX: baseCell.x, endX: endCell.x});
    }

    const resetPopupMessageState = () => {
        setPopupMsgInfo({msg: "", show: false});
    }

    const deleteTask = (id: string, date: TaskDate, isRepetitive: boolean) => {
        if(!isRepetitive) {
            setPopupMsgInfo({
                msg: "Do you really want to delete this event?",
                show: true,
                options: [
                    {name: "ok", callback: () => {
                        gqlDeleteTask(id);
                        fetchTasks();
                        resetPopupMessageState();
                    }},
                    {name: "cancel", callback: resetPopupMessageState}
                ]
            });
            return;
        }
        setPopupMsgInfo({
            msg: "Do you want to delete only this event or all the events?",
            show: true,
            options: [
                {name: "delete event", callback: ()=>{
                    gqlDeleteSingleTask(id, date);
                    fetchTasks();
                    resetPopupMessageState();
                }},
                {name: "delete all", callback: ()=>{
                    gqlDeleteTask(id);
                    fetchTasks();
                    resetPopupMessageState();
                }},
                {name: "cancel", callback: resetPopupMessageState}
            ]
        });
    }

    const updateTimePointerWithInterval = (intervalInMs: number)=>{
        updateTimePointer();
        setTimeout(()=>updateTimePointerWithInterval(intervalInMs), intervalInMs);
    }

    const calcDate = (day: number): Date => {
        const msInDay = 1000 * 60 * 60 * 24;
        return new Date(props.weekStartDate.getTime() + (day * msInDay));
    }

    const calcSelectedCells = (currentCell: CellBasicInfo): CellBasicInfo[] => {
        const firstCell = selectedCells[0];
        const cells = [] as CellBasicInfo[];
        let startQuarter = firstCell.hour * 4 + firstCell.quarter;
        let endQuarter = currentCell.hour * 4 + currentCell.quarter;
        let dir = 0;
        if(currentCell.hour < firstCell.hour || (currentCell.hour === firstCell.hour && currentCell.quarter < firstCell.quarter)) {
            dir = 1;
        }
        if(dir === 0) {
            for(let q = startQuarter; q <= endQuarter; q+=1) {
                cells.push({day: firstCell.day, hour: Math.floor(q/4), quarter: q % 4});
            }
        } else {
            for(let q = startQuarter; q >= endQuarter; q-=1) {
                cells.push({day: firstCell.day, hour: Math.floor(q/4), quarter: q % 4});
            }
        }
        return cells;
    }

    const hideTaskWnd = ()=>{
        setWndTaskInfo({...wndTaskInfo, show: false});
    }

    const getDailyTaskTabMinHeight = (): number => {
        const dailyCount = new Map() as Map<number, number>;
        tasks.filter((val: Task) => val.isDaily).forEach((val: Task) => {
            const count = dailyCount.get(val.dayOfWeek);
            if(count === undefined) {
                dailyCount.set(val.dayOfWeek, 1);
                return;
            }
            dailyCount.set(val.dayOfWeek, count + 1);
        });
        return Array.from(dailyCount.values()).reduce((val: number, acc: number) => (val > acc) ? val : acc, 0);
    }

    const daysList = Array.from(dayMapping.entries()).map((value: [number, string]) => (
        <Day key={value[0]} day={value[0]} dayName={value[1]} date={calcDate(value[0])} selectedCells={selectedCells}
            maxDailyTasksInWeekPerDay={getDailyTaskTabMinHeight()}
            dailyTasks={
                tasks
                .filter((val: Task) => val.dayOfWeek === value[0] && val.isDaily)
                .map((val: Task) => val.toTaskState(props.weekStartDate))
            }
            onGridSizeChange={()=>updateCellsInStore()}
            updateRefs={(hour: number, quarterRefs: RefObject<HTMLDivElement>[])=>{
                const day = cells.get(value[0]);
                const hourCells = [
                    {day: value[0], hour: hour, quarter: 0, x: 0, y: 0, width: 0, height: 0, ref: quarterRefs[0]},
                    {day: value[0], hour: hour, quarter: 1, x: 0, y: 0, width: 0, height: 0, ref: quarterRefs[1]},
                    {day: value[0], hour: hour, quarter: 2, x: 0, y: 0, width: 0, height: 0, ref: quarterRefs[2]},
                    {day: value[0], hour: hour, quarter: 3, x: 0, y: 0, width: 0, height: 0, ref: quarterRefs[3]},
                ];
                if(day === undefined) {
                    cells.set(value[0], {dailyTasksRef: undefined, hourlyRefs: new Map([[hour, hourCells]])});
                    setCells(cells);
                    return;
                }
                day.hourlyRefs.set(hour, hourCells);
                setCells(cells);
            }}
            updateDayRef={(ref: RefObject<HTMLDivElement>)=>{
                const day = cells.get(value[0]);
                const dailyTask = {day: value[0], x: 0, y: 0, width: 0, height: 0, ref: ref};
                if(day === undefined) {
                    cells.set(value[0], {dailyTasksRef: dailyTask, hourlyRefs: new Map()});
                    setCells(cells);
                    return;
                }
                day.dailyTasksRef = dailyTask;
                setCells(cells);
            }}
            startSelection={(day: number, hour: number, quarter: number)=>{
                setSelectedCells([{day: day, hour: hour, quarter: quarter}]);
            }}
            endSelection={(day: number, hour: number, quarter: number)=>{
                if(selectedCells.length === 0) { return; }
                const nextCellVal = hour * 4 + quarter + 1;
                hour = Math.floor(nextCellVal / 4);
                quarter = nextCellVal % 4;
                const cells = calcSelectedCells({day: day, hour: hour, quarter: quarter});
                setWndTaskInfo({id: undefined, date: extractDate(props.weekStartDate, cells), startTime: extractStartTime(cells), endTime: extractEndTime(cells), basicInfo: undefined, description: undefined, category: undefined, repetition: undefined, show: true});
                setSelectedCells([]);
            }}
            hoverOverCell={(day: number, hour: number, quarter: number)=>{
                if(selectedCells.length === 0) { return; }
                setSelectedCells(calcSelectedCells({day: day, hour: hour, quarter: quarter}));
            }}
            moveTask={(taskState: TaskState, pos: Position, x: number, y: number, width: number, height: number)=>{
                const task = tasks.find((val: Task) => val.taskId === taskState.id);
                if(task === undefined) {
                    return;
                }
                task.x = x - task.getLeftPadding();
                task.y = y;
                task.startTime = taskState.startTime;
                task.endTime = taskState.endTime;
                task.width = width;
                task.height = height;
                setGrabbed(true);
                setModifyObject(task.id);
                setStartMovePos(pos);
            }}
            select={(task: TaskState) => {
                setWndTaskInfo({...task, show: true});
            }}
            createDailyTask={() => {
                setWndTaskInfo({
                    id:  undefined,
                    date: getAbsDate(value[0], props.weekStartDate),
                    startTime: undefined,
                    endTime: undefined,
                    basicInfo: "",
                    description: "",
                    category: undefined,
                    repetition: undefined,
                    show: true
                });
            }}
            deleteTask={(task: TaskState) => {
                deleteTask(task.id, task.date, task.repetition !== undefined);
            }}
        />
    ));

    const tasksList = tasks.filter((value: Task) => !value.isDaily).map((value: Task) => (
        <CalendarTask key={value.id} top={value.y} left={value.x + value.getLeftPadding()} width={value.width - value.getLeftPadding() - value.getRightPadding()} height={value.height} basicInfo={value.basicInfo} category={value.category} zIndex={value.zIndex}
            grabbed={(position: Position)=>{
                setStartMovePos(position); 
                setGrabbed(true); 
                setModifyObject(value.id);
            }}
            resize={(position: Position, direction: ResizeDir)=>{
                if(isGrabbed) { return; }
                setStartMovePos(position);
                setResize({state: true, direction: direction});
                setModifyObject(value.id);
            }}
            selected={()=>{
                setWndTaskInfo({id: value.taskId, date: value.getDate(props.weekStartDate), startTime: value.startTime, endTime: value.endTime, basicInfo: value.basicInfo, description: value.description, category: value.category, repetition: value.repetition, show: true});
            }}
            deleteTask={()=>{
                deleteTask(value.taskId, value.getDate(props.weekStartDate), value.repetition !== undefined);
            }}
        />
    ));

    const findCell = (point: Position): CellInfo | undefined => {
        let targetCell: CellInfo | undefined = undefined;
        cells.forEach((dayStore: DayCellStore, day: number)=>{
            if(targetCell !== undefined) { return; }
            if(dayStore.dailyTasksRef !== undefined && isPointInsideCell(dayStore.dailyTasksRef, point)) {
                targetCell = dayStore.dailyTasksRef;
                return;
            }
            dayStore.hourlyRefs.forEach((quarters: CellInfo[], hour: number)=>{
                quarters.forEach((cell: CellInfo)=>{
                    if(!isPointInsideCell(cell, point)) { return; }
                    targetCell = cell;
                });
            });
        });
        return targetCell;
    }

    const findCellByTime = (date: Date): CellInfo | undefined => {
        const msInDay = 1000 * 60 * 60 * 24;
        const endDate = new Date(props.weekStartDate.getTime() + 7 * msInDay);
        if(date < props.weekStartDate || date > endDate) {
            return undefined;
        }

        const day = (date.getDay() === 0) ? 6 : date.getDay() - 1;
        const hour = date.getHours();
        const minutes = date.getMinutes();
        let targetCell: CellInfo | undefined = undefined;
        cells.forEach((dayStore: DayCellStore, dayVal: number)=>{
            dayStore.hourlyRefs.forEach((quarters: CellInfo[], hourVal: number)=>{
                quarters.forEach((cell: CellInfo)=>{
                    if(day != dayVal || hour != hourVal || cell.quarter === undefined) {
                        return;
                    }
                    if(minutes >= cell.quarter * 15 && minutes < (cell.quarter + 1) * 15) {
                        targetCell = cell;
                    }
                });
            });
        });
        return targetCell;
    }

    const grabActionHandler = (currentPos: Position)=>{
        const diff = new Position(currentPos.x - startMovePos.x, currentPos.y - startMovePos.y);
        setStartMovePos(currentPos);
        setTasks(calcOverlapping(tasks.map((task: Task) => {
            if(task.id !== modifyObject) {
                return task;
            }
            task.move(diff);
            return task;
        })));
    }

    const updateTask = (task: TaskState) => {
        if(task.repetition === undefined) {
            gqlUpdateTask(task);
            return;
        }
        setPopupMsgInfo({
            msg: "Do you want to update only this event or all the events?",
            show: true,
            options: [
                {name: "update event", callback: ()=>{
                    gqlUpdateSingleTask(task);
                    fetchTasks();
                    resetPopupMessageState();
                }},
                {name: "update all", callback: ()=>{
                    gqlUpdateTask(task).then(()=>fetchTasksFromApi().then(()=>fetchTasks()));
                    resetPopupMessageState();
                }},
                {name: "cancel", callback: ()=>{
                    fetchTasks();
                    resetPopupMessageState();
                }}
            ]
        });
    }

    const grabActionFinalizer = ()=>{
        setGrabbed(false);
        setTasks(calcOverlapping(tasks.map((task: Task) => {
            if(task.id !== modifyObject) {
                return task;
            }

            const getMajorityCell = (): CellInfo | undefined =>{
                const firstCell = findCell(new Position(task.x, task.y));
                if(firstCell === undefined) { return undefined; }
                const secondCell = findCell(new Position(task.x + task.width, task.y));
                if(secondCell === undefined) { return undefined; }

                if(task.x - firstCell.x < secondCell.x - task.x) {
                    return firstCell;
                }
                return secondCell;
            };

            const cell = getMajorityCell();
            if(cell === undefined) {
                const cell = findCell(startMovePos);
                if(cell !== undefined && isCellDaily(cell)) {
                    task.setDaily(cell.day);
                    updateTask(task.toTaskState(props.weekStartDate));
                    return task;
                }
                updateCellsInStore();
                return task;
            }
            if(isCellDaily(cell)) {
                task.setDaily(cell.day);
                updateTask(task.toTaskState(props.weekStartDate));
                return task;
            }
            task.setPosition(new Position(cell.x, cell.y));

            const endCell = findCell(new Position(task.x, task.y + task.height - task.minHeight / 2));
            if(endCell === undefined) {
                updateCellsInStore();
                return task;
            }

            if(endCell.hour === undefined || endCell.quarter === undefined
                || cell.hour === undefined || cell.quarter === undefined) { 
                return task; 
            }

            let endHour = endCell.hour;
            let endQuarter = endCell.quarter + 1;
            if(endQuarter === 4) {
                endHour += 1;
                endQuarter = 0;
            }
            task.updateTime(cell.day, cell.hour, cell.quarter, endHour, endQuarter);
            updateTask(task.toTaskState(props.weekStartDate));
            return task;
        })));
    }

    const resizeActionHandler = (currentPos: Position)=>{
        const diff = new Position(currentPos.x - startMovePos.x, currentPos.y - startMovePos.y);
        setStartMovePos(currentPos);
        setTasks(calcOverlapping(tasks.map((task: Task) => {
            if(task.id !== modifyObject) {
                return task;
            }
            if(task === undefined) { return task; }
            if(resizeAction.direction === undefined) { return task; }
            if(resizeAction.direction === ResizeDir.up) { task.resizeUp(diff.y); }
            else { task.resizeDown(diff.y); }
            return task;
        })));
    }

    const resizeActionFinalizer = ()=>{
        const dir = resizeAction.direction;
        setResize({state: false, direction: undefined});
        setTasks(calcOverlapping(tasks.map((task: Task) => {
            if(task.id !== modifyObject) {
                return task;
            }
            if(dir === ResizeDir.up) {
                const targetCell = findCell(new Position(task.x, task.y));
                if(targetCell === undefined) { 
                    updateCellsInStore();
                    return task;
                }
                task.resizeUp(targetCell.y - task.y);
            } else {
                const targetCell = findCell(new Position(task.x, task.y + task.height));
                if(targetCell === undefined) { 
                    updateCellsInStore();
                    return task; 
                }
                task.resizeDown((targetCell.y + targetCell.height) - (task.y + task.height));
            }

            const baseCell = findCell(new Position(task.x, task.y + task.minHeight / 2));
            const endCell = findCell(new Position(task.x, task.y + task.height - task.minHeight / 2));
            if(baseCell === undefined || endCell === undefined) {
                updateCellsInStore();
                return task;
            }

            if(baseCell.hour === undefined || baseCell.quarter === undefined
                || endCell.hour === undefined || endCell.quarter === undefined) { 
                return task;
            }

            let endHour = endCell.hour;
            let endQuarter = endCell.quarter + 1;
            if(endQuarter === 4) {
                endHour += 1;
                endQuarter = 0;
            }
            task.updateTime(baseCell.day, baseCell.hour, baseCell.quarter, endHour, endQuarter);

            updateTask(task.toTaskState(props.weekStartDate));
            return task;
        })));
    }

    return (
        <>
            <div className="btn-row">
                <button type="button" className="change-week-btn" onClick={()=>{
                    props.changeWeek(calcDate(-7));
                    init(false);
                }}>&lt;&lt;</button>
                <button type="button" className="change-week-btn" onClick={()=>{
                    props.changeWeek(calcDate(7));
                    init(false);
                }}>&gt;&gt;</button>
                <button type="button" className="change-week-btn" onClick={()=>updateCalendarFontSize(-1)}>-</button>
                <button type="button" className="change-week-btn" onClick={()=>updateCalendarFontSize(1)}>+</button>
                <button type="button" className="change-week-btn" onClick={()=>{
                    props.changeWeek(new Date(Date.now()));
                    init(false);
                }}>today</button>
            </div>
            <div className="calendar-view" style={{fontSize: `${calendarFont.size}pt`}}
                onMouseUp={()=>{
                    if(!isGrabbed && !resizeAction.state) { return; }
                    if(isGrabbed) { grabActionFinalizer(); }
                    if(resizeAction.state) { resizeActionFinalizer(); }
                }}
                onMouseMove={(event)=>{
                    if(!isGrabbed && !resizeAction.state) { return; }
                    const currentPos = new Position(event.pageX, event.pageY);
                    if(isGrabbed) { grabActionHandler(currentPos); }
                    if(resizeAction.state) { resizeActionHandler(currentPos); }
                }}
            >
                <CurrentTimePointer state={pointerState} />
                <TaskWnd id={wndTaskInfo.id}
                    date={wndTaskInfo.date}
                    startTime={wndTaskInfo.startTime}
                    endTime={wndTaskInfo.endTime}
                    basicInfo={wndTaskInfo.basicInfo}
                    description={wndTaskInfo.description}
                    category={wndTaskInfo.category}
                    repetition={wndTaskInfo.repetition}
                    show={wndTaskInfo.show}
                    hide={hideTaskWnd}
                    save={() => forceRefresh()}
                />
                <PopupMessage show={popupMsgInfo.show} message={popupMsgInfo.msg}
                    options={popupMsgInfo.options}
                    hide={()=>{
                        resetPopupMessageState();
                        fetchTasks();
                    }}
                />
                {daysList}
                {tasksList}
            </div>
        </>
    );
}

export default Calendar;
