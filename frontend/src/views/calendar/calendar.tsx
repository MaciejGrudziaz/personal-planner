import React, {RefObject, useEffect, useState} from 'react';
import {useDispatch, useSelector, useStore} from 'react-redux';
import {RootState} from '../../store/store';
import Day, {Hour, Cell} from './day';
import CalendarTask, {Task, Position, ResizeDir} from './task';
import CurrentTimePointer, {PointerState} from './current-time-pointer';
import {updateTask, TaskState, findTasksForWeek} from '../../store/tasks';
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

function Calendar(props: Props) {
    const [isGrabbed, setGrabbed] = useState(false);
    const [resizeAction, setResize] = useState({state: false, direction: undefined} as ResizeAction);
    const [startMovePos, setStartMovePos] = useState(new Position(0, 0));
    const [modifyObject, setModifyObject] = useState(undefined as string | undefined);
    const [tasks, setTasks] = useState(new Array() as Task[]);
    const [cells, setCells] = useState(new Map() as Map<number, Map<number, CellInfo[]>>);
    const [pointerState, setPointerState] = useState(undefined as undefined | PointerState);
    const [isInitialized, init] = useState(false);
    const dayMapping: Map<number, string> = new Map([[0, "monday"], [1, "tuesday"], [2, "wednesday"], [3, "thursday"], [4, "friday"], [5, "saturday"], [6, "sunday"]]);

    const store = useStore();
    const dispatch = useDispatch();

    useEffect(()=>{
        if(isInitialized) { return; }
        window.addEventListener('resize', updateCellsInStore);
        updateCellsInStore();
        fetchTasks();
        init(true);
    });

    const fetchTasks = ()=>{
        const tasksState = (store.getState() as RootState).tasksState;
        while(tasks.length > 0) { tasks.pop(); }
        findTasksForWeek(props.weekStartDate, tasksState).forEach((taskInfo: TaskState) => {
            const task = new Task(taskInfo.id, new Date(taskInfo.day), taskInfo.startTime, taskInfo.endTime, taskInfo.category)
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
        const baseCell = findCellByTime(props.weekStartDate);
        if(baseCell === undefined) {
            setPointerState(undefined);
            return;
        }
        const verticalOffset = parseInt(((currentDate.getMinutes() - matchingCell.quarter * 15) / 15 * matchingCell.height).toFixed());
        setPointerState({width: matchingCell.width, x: matchingCell.x, y: matchingCell.y + verticalOffset, baseX: baseCell.x});
    }

    const calcDate = (day: number): Date => {
        const msInDay = 1000 * 60 * 60 * 24;
        return new Date(props.weekStartDate.getTime() + (day * msInDay));
    }

    const daysList = Array.from(dayMapping.entries()).map((value: [number, string]) => (
        <Day day={value[0]} dayName={value[1]} date={calcDate(value[0])} updateRefs={(hour: number, quarterRefs: RefObject<HTMLDivElement>[])=>{
            const day = cells.get(value[0]);
            if(day === undefined) {
                cells.set(value[0], new Map([[hour, [
                    {day: value[0], hour: hour, quarter: 0, x: 0, y: 0, width: 0, height: 0, ref: quarterRefs[0]},
                    {day: value[0], hour: hour, quarter: 1, x: 0, y: 0, width: 0, height: 0, ref: quarterRefs[1]},
                    {day: value[0], hour: hour, quarter: 2, x: 0, y: 0, width: 0, height: 0, ref: quarterRefs[2]},
                    {day: value[0], hour: hour, quarter: 3, x: 0, y: 0, width: 0, height: 0, ref: quarterRefs[3]},
                ]]]));
                setCells(cells);
                return;
            }
            day.set(hour, [
                {day: value[0], hour: hour, quarter: 0, x: 0, y: 0, width: 0, height: 0, ref: quarterRefs[0]},
                {day: value[0], hour: hour, quarter: 1, x: 0, y: 0, width: 0, height: 0, ref: quarterRefs[1]},
                {day: value[0], hour: hour, quarter: 2, x: 0, y: 0, width: 0, height: 0, ref: quarterRefs[2]},
                {day: value[0], hour: hour, quarter: 3, x: 0, y: 0, width: 0, height: 0, ref: quarterRefs[3]},
            ]);
            setCells(cells);
        }}/>
    ));

    const tasksList = tasks.map((value: Task)=>(
        <CalendarTask top={value.y} left={value.x + value.getLeftPadding()} width={value.width - value.getLeftPadding() - value.getRightPadding()} height={value.height} color={value.color} zIndex={value.zIndex}
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
                    if(minutes > cell.quarter * 15 && minutes < (cell.quarter + 1) * 15) {
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
            <button type="button" className="change-week-btn" onClick={()=>{
                init(false);
                props.changeWeek(calcDate(-7));
            }}>-</button>
            <button type="button" className="change-week-btn" onClick={()=>{
                init(false);
                props.changeWeek(calcDate(7));
            }}>+</button>
            <div className="calendar-view" 
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
                {daysList}
                {tasksList}
            </div>
        </>
    );
}

export default Calendar;
