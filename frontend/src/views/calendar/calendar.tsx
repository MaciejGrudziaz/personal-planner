import React, {RefObject, useEffect, useState} from 'react';
import {useDispatch, useSelector, useStore} from 'react-redux';
import {RootState} from '../../store/store';
import Day, {Hour, Cell} from './day';
import TaskWnd from './task-wnd';
import {CellBasicInfo, extractDate, extractStartTime, extractEndTime} from './hour';
import CalendarTask, {Task, Position, ResizeDir} from './task';
import CurrentTimePointer, {PointerState} from './current-time-pointer';
import {updateTask, deleteTask, TaskState, findTasksForWeek, parseDateToBuiltin, TaskDate, TaskTime, TaskCategory} from '../../store/tasks';
import {useFetchTasks} from '../../gql-client/queries';
import './calendar.css';

interface ResizeAction {
    state: boolean;
    direction: ResizeDir | undefined;
}

interface Props {
    weekStartDate: Date;
    changeWeek(baseDate: Date): void;
}

export interface CellInfo {
    day: number;
    hour: number;
    quarter: number;
    x: number;
    y: number;
    width: number;
    height: number;
    ref: RefObject<HTMLDivElement>;
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
    category: TaskCategory | undefined;
    show: boolean;
}

function Calendar(props: Props) {
    const [isGrabbed, setGrabbed] = useState(false);
    const [resizeAction, setResize] = useState({state: false, direction: undefined} as ResizeAction);
    const [startMovePos, setStartMovePos] = useState(new Position(0, 0));
    const [modifyObject, setModifyObject] = useState(undefined as string | undefined);
    const [tasks, setTasks] = useState(new Array() as Task[]);
    const [cells, setCells] = useState(new Map() as Map<number, Map<number, CellInfo[]>>);
    const [pointerState, setPointerState] = useState(undefined as undefined | PointerState);
    const [calendarFont, setCalendarFont] = useState({size: 12, changed: false} as FontState);
    const [selectedCells, setSelectedCells] = useState([] as CellBasicInfo[]);
    const [wndTaskInfo, setWndTaskInfo] = useState({id: undefined, date: undefined, startTime: undefined, endTime: undefined, show: false} as WndTaskInfo);
    const [isInitialized, init] = useState(false);
    const dayMapping: Map<number, string> = new Map([[0, "monday"], [1, "tuesday"], [2, "wednesday"], [3, "thursday"], [4, "friday"], [5, "saturday"], [6, "sunday"]]);

    const store = useStore();
    const dispatch = useDispatch();

    useEffect(()=>{
        if(isInitialized) {
            if(calendarFont.changed) {
                updateCellsInStore();
                setCalendarFont({...calendarFont, changed: false});
            }
            return; 
        }
        window.addEventListener('resize', updateCellsInStore);
        setTimeout(()=>updateTimePointerWithInterval(60 * 1000), 60 * 1000);
        updateCellsInStore();
        fetchTasks();
        store.subscribe(fetchTasks);
        init(true);
    });

    const fetchTasks = ()=>{
        const tasksState = (store.getState() as RootState).tasksState;
        while(tasks.length > 0) { tasks.pop(); }
        findTasksForWeek(props.weekStartDate, tasksState).forEach((taskInfo: TaskState) => {
            const task = new Task(taskInfo.id, parseDateToBuiltin(taskInfo.date), taskInfo.startTime, taskInfo.endTime, taskInfo.basicInfo, taskInfo.description, taskInfo.category)
            task.init(cells);
            tasks.push(task);
        });
        calcOverlapping();
        setTasks([...tasks]);
    }

    const calcOverlapping = ()=>{
        let retry = true;
        let retryId = 1;
        while(retry) {
            console.log(`retry ${retryId}`);
            retry = false;
            tasks.forEach((task: Task)=>{
                if(task.calcOverlapping(tasks)) { retry = true; }
            });
            retryId += 1;
        }
    }

    const updateTasks = ()=>{
        let needsUpdate = false;
        tasks.forEach((task: Task)=>{
            const oldParams = {x: task.x, y: task.y, width: task.width, height: task.height};
            task.init(cells);
            // task.calcOverlapping(tasks);
            if(oldParams.x !== task.x || oldParams.y !== task.y || oldParams.width !== task.width || oldParams.height !== task.height) {
                needsUpdate = true;
            }
        });
        calcOverlapping();
        if(needsUpdate) { 
            setTasks([...tasks]); 
        }
    };

    const updateCalendarFontSize = (diff: number)=>{
        setCalendarFont({size: calendarFont.size + diff, changed: true});
    }

    const updateCellsInStore = ()=>{
        cells.forEach((hourMap: Map<number, CellInfo[]>, day: number)=>{
            hourMap.forEach((quarters: CellInfo[], hour: number)=>{
                quarters.forEach((cell: CellInfo, quarter: number)=>{
                    const el = cell.ref.current;
                    if(el === null) { return; }
                    cell.x = el.offsetLeft;
                    cell.y = el.offsetTop;
                    cell.width = el.offsetWidth;
                    cell.height = el.offsetHeight;
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
        const verticalOffset = Math.floor((currentDate.getMinutes() - matchingCell.quarter * 15) / 15 * matchingCell.height);
        setPointerState({width: matchingCell.width, x: matchingCell.x, y: matchingCell.y + verticalOffset, baseX: baseCell.x});
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

    const showTaskWnd = ()=>{
        setWndTaskInfo({...wndTaskInfo, show: true});
    }

    const hideTaskWnd = ()=>{
        setWndTaskInfo({...wndTaskInfo, show: false});
    }

    const daysList = Array.from(dayMapping.entries()).map((value: [number, string]) => (
        <Day day={value[0]} dayName={value[1]} date={calcDate(value[0])} selectedCells={selectedCells}
            updateRefs={(hour: number, quarterRefs: RefObject<HTMLDivElement>[])=>{
                const day = cells.get(value[0]);
                const hourCells = [
                    {day: value[0], hour: hour, quarter: 0, x: 0, y: 0, width: 0, height: 0, ref: quarterRefs[0]},
                    {day: value[0], hour: hour, quarter: 1, x: 0, y: 0, width: 0, height: 0, ref: quarterRefs[1]},
                    {day: value[0], hour: hour, quarter: 2, x: 0, y: 0, width: 0, height: 0, ref: quarterRefs[2]},
                    {day: value[0], hour: hour, quarter: 3, x: 0, y: 0, width: 0, height: 0, ref: quarterRefs[3]},
                ];
                if(day === undefined) {
                    cells.set(value[0], new Map([[hour, hourCells]]));
                    setCells(cells);
                    return;
                }
                day.set(hour, hourCells);
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
                setWndTaskInfo({id: undefined, date: extractDate(props.weekStartDate, cells), startTime: extractStartTime(cells), endTime: extractEndTime(cells), basicInfo: undefined, description: undefined, category: undefined, show: true});
                setSelectedCells([]);
            }}
            hoverOverCell={(day: number, hour: number, quarter: number)=>{
                if(selectedCells.length === 0) { return; }
                setSelectedCells(calcSelectedCells({day: day, hour: hour, quarter: quarter}));
            }}
        />
    ));

    const tasksList = tasks.map((value: Task)=>(
        <CalendarTask top={value.y} left={value.x + value.getLeftPadding()} width={value.width - value.getLeftPadding() - value.getRightPadding()} height={value.height} basicInfo={value.basicInfo} category={value.category} zIndex={value.zIndex}
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
                setWndTaskInfo({id: value.id, date: value.getDate(props.weekStartDate), startTime: value.startTime, endTime: value.endTime, basicInfo: value.basicInfo, description: value.description, category: value.category, show: true});
            }}
            deleteTask={()=>{
                store.dispatch(deleteTask(value.id));
            }}
        />
    ));

    const findCell = (point: Position): CellInfo | undefined => {
        let targetCell: CellInfo | undefined = undefined;
        cells.forEach((hours: Map<number, CellInfo[]>, day: number)=>{
            hours.forEach((quarters: CellInfo[], hour: number)=>{
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
        cells.forEach((hours: Map<number, CellInfo[]>, dayVal: number)=>{
            hours.forEach((quarters: CellInfo[], hourVal: number)=>{
                quarters.forEach((cell: CellInfo)=>{
                    if(day != dayVal || hour != hourVal) {
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
        const task = tasks.find((value: Task)=>{ return value.id === modifyObject; });
        if(task === undefined) { return; }
        task.move(diff);
        setTasks([...tasks]);
    }

    const grabActionFinalizer = ()=>{
        setGrabbed(false);
        const task = tasks.find((value: Task)=>{ return value.id === modifyObject; });
        if(task === undefined) { return; }

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
        if(cell === undefined) { return; }
        const taskBasePos = new Position(task.x, task.y);
        task.setPosition(new Position(cell.x, cell.y));

        const endCell = findCell(new Position(task.x, task.y + task.height - task.minHeight / 2));
        if(endCell === undefined) {
            task.setPosition(taskBasePos);
            return;
        }
        let endHour = endCell.hour;
        let endQuarter = endCell.quarter + 1;
        if(endQuarter === 4) {
            endHour += 1;
            endQuarter = 0;
        }
        task.updateTime(cell.day, cell.hour, cell.quarter, endHour, endQuarter);
        dispatch(updateTask(task.toTaskState(props.weekStartDate)));

        calcOverlapping();
        setTasks([...tasks]);
    }

    const resizeActionHandler = (currentPos: Position)=>{
        const diff = new Position(currentPos.x - startMovePos.x, currentPos.y - startMovePos.y);
        setStartMovePos(currentPos);
        const task = tasks.find((value: Task)=>{ return value.id === modifyObject; });
        if(task === undefined) { return; }
        if(resizeAction.direction === undefined) { return; }
        if(resizeAction.direction === ResizeDir.up) { task.resizeUp(diff.y); }
        else { task.resizeDown(diff.y); }
        setTasks([...tasks]);
    }

    const resizeActionFinalizer = ()=>{
        const dir = resizeAction.direction;
        setResize({state: false, direction: undefined});
        const task = tasks.find((value: Task)=>{ return value.id === modifyObject; });
        if(task === undefined) { return; }
        const taskBasePos = new Position(task.x, task.y);
        const taskBaseHeight = task.height;

        if(dir === ResizeDir.up) {
            const targetCell = findCell(new Position(task.x, task.y));
            if(targetCell === undefined) { return; }
            task.resizeUp(targetCell.y - task.y);
        } else {
            const targetCell = findCell(new Position(task.x, task.y + task.height));
            if(targetCell === undefined) { return; }
            task.resizeDown((targetCell.y + targetCell.height) - (task.y + task.height));
        }

        const baseCell = findCell(new Position(task.x, task.y + task.minHeight / 2));
        const endCell = findCell(new Position(task.x, task.y + task.height - task.minHeight / 2));
        if(baseCell === undefined || endCell === undefined) {
            task.setPosition(taskBasePos);
            task.height = taskBaseHeight;
            return;
        }
        let endHour = endCell.hour;
        let endQuarter = endCell.quarter + 1;
        if(endQuarter === 4) {
            endHour += 1;
            endQuarter = 0;
        }
        task.updateTime(baseCell.day, baseCell.hour, baseCell.quarter, endHour, endQuarter);

        dispatch(updateTask(task.toTaskState(props.weekStartDate)));
        calcOverlapping();
        setTasks([...tasks]);
    }

    return (
        <>
            <div className="btn-row">
                <button type="button" className="change-week-btn" onClick={()=>{
                    init(false);
                    props.changeWeek(calcDate(-7));
                }}>&lt;&lt;</button>
                <button type="button" className="change-week-btn" onClick={()=>{
                    init(false);
                    props.changeWeek(calcDate(7));
                }}>&gt;&gt;</button>
                <button type="button" className="change-week-btn" onClick={()=>updateCalendarFontSize(-1)}>-</button>
                <button type="button" className="change-week-btn" onClick={()=>updateCalendarFontSize(1)}>+</button>
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
                    show={wndTaskInfo.show}
                    hide={hideTaskWnd}
                    save={()=>fetchTasks()}
                />
                {daysList}
                {tasksList}
            </div>
        </>
    );
}

export default Calendar;
