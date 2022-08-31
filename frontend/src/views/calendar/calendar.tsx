import React, {RefObject, useEffect, useState} from 'react';
import {useDispatch, useSelector, useStore} from 'react-redux';
import {RootState} from '../../store/store';
import Day, {Hour, Cell} from './day';
import CalendarTask, {Task, Position, ResizeDir} from './task';
import {updateCells, CellInfo, WeekViewState, DayState, HourState, CellState, isPointInsideCell} from '../../store/week-view';
import './calendar.css';
import {WriteFileCallback} from 'typescript';

interface ResizeAction {
    state: boolean;
    direction: ResizeDir | undefined;
}

function Calendar() {
    const [isGrabbed, setGrabbed] = useState(false);
    const [resizeAction, setResize] = useState({state: false, direction: undefined} as ResizeAction);
    const [startMovePos, setStartMovePos] = useState(new Position(0, 0));
    const [modifyObject, setModifyObject] = useState(undefined as string | undefined);
    const [tasks, setTasks] = useState([
        new Task("task1", new Date("2022-08-29"), "12:00", "14:00", "red"),
        new Task("task2", new Date("2022-08-31"), "10:30", "11:35", "yellow"),
        new Task("task3", new Date("2022-08-30"), "14:30", "18:39", "blue"),
        new Task("task4", new Date("2022-08-28"), "14:30", "18:39", "green"),
    ]);
    const [refs, setRefs] = useState(new Map() as Map<number, Map<number, RefObject<HTMLDivElement>[]>>);
    const dayMapping: Map<number, string> = new Map([[0, "monday"], [1, "tuesday"], [2, "wednesday"], [3, "thursday"], [4, "friday"], [5, "saturday"], [6, "sunday"]]);

    const store = useStore();
    const dispatch = useDispatch();
    const [isInitialized, init] = useState(false);

    const updateTasks = ()=>{
        let needsUpdate = false;
        tasks.forEach((task: Task)=>{
            const oldParams = {x: task.x, y: task.y, width: task.width, height: task.height};
            task.calcOverlapping(tasks);
            task.init((store.getState() as RootState).weekViewState);
            if(oldParams.x !== task.x || oldParams.y !== task.y || oldParams.width !== task.width || oldParams.height !== task.height) {
                needsUpdate = true;
            }
        });
        if(needsUpdate) { 
            setTasks([...tasks]); 
        }
    };

    const updateCellsInStore = ()=>{
        const cellsInfo: CellInfo[] = [];
        refs.forEach((hourMap: Map<number, RefObject<HTMLDivElement>[]>, day: number)=>{
            hourMap.forEach((quarterRefs: RefObject<HTMLDivElement>[], hour: number)=>{
                quarterRefs.forEach((ref: RefObject<HTMLDivElement>, quarter: number)=>{
                    const el = ref.current;
                    if(el === null) { return; }
                    cellsInfo.push({day: day, hour: hour, quarter: quarter, x: el.offsetLeft, y: el.offsetTop, width: el.offsetWidth, height: el.offsetHeight});
                });
            });
        });
        dispatch(updateCells(cellsInfo));
    };

    useEffect(()=>{
        if(isInitialized) { return; }
        window.addEventListener('resize', updateCellsInStore);
        store.subscribe(updateTasks);
        updateCellsInStore();
        init(true);
    });

    const daysList = Array.from(dayMapping.entries()).map((value: [number, string]) => (
        <Day day={value[0]} dayName={value[1]} updateRefs={(hour: number, quarterRefs: RefObject<HTMLDivElement>[])=>{
            const refDay = refs.get(value[0]);
            if(refDay === undefined) {
                const refHour = new Map() as Map<number, RefObject<HTMLDivElement>[]>;
                refHour.set(hour, quarterRefs);
                refs.set(value[0], refHour);
                return;
            }
            refDay.set(hour, quarterRefs);
            setRefs({...refs});
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
        const weekViewState = (store.getState() as RootState).weekViewState;
        weekViewState.days.forEach((day: DayState)=>{
            day.hours.forEach((hour: HourState)=>{
                hour.cells.forEach((cell: CellState)=>{
                    if(!isPointInsideCell(cell, point)) { return; }
                    targetCell = {day: day.day, hour: hour.hour, quarter: cell.quarter, x: cell.x, y: cell.y, width: cell.width, height: cell.height};
                });
            });
        });
        return targetCell;
    }

    function grabActionHandler(currentPos: Position) {
        const diff = new Position(currentPos.x - startMovePos.x, currentPos.y - startMovePos.y);
        setStartMovePos(currentPos);
        const task = tasks.find((value: Task)=>{ return value.id === modifyObject; });
        if(task === undefined) { return; }
        task.move(diff);
        setTasks([...tasks]);
    }

    function grabActionFinalizer() {
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
        task.setPosition(new Position(cell.x, cell.y));
        task.day = cell.day;
        tasks.forEach((value: Task)=> value.calcOverlapping(tasks));
        setTasks([...tasks]);
    }

    function resizeActionHandler(currentPos: Position) {
        const diff = new Position(currentPos.x - startMovePos.x, currentPos.y - startMovePos.y);
        setStartMovePos(currentPos);
        const task = tasks.find((value: Task)=>{ return value.id === modifyObject; });
        if(task === undefined) { return; }
        if(resizeAction.direction === undefined) { return; }
        if(resizeAction.direction === ResizeDir.up) { task.resizeUp(diff.y); }
        else { task.resizeDown(diff.y); }
        setTasks([...tasks]);
    }

    function resizeActionFinalizer() {
        const dir = resizeAction.direction;
        setResize({state: false, direction: undefined});
        const task = tasks.find((value: Task)=>{ return value.id === modifyObject; });
        if(task === undefined) { return; }
        if(dir === ResizeDir.up) {
            const targetCell = findCell(new Position(task.x, task.y));
            if(targetCell === undefined) { return; }
            task.resizeUp(targetCell.y - task.y);
        } else {
            const targetCell = findCell(new Position(task.x, task.y + task.height));
            if(targetCell === undefined) { return; }
            task.resizeDown((targetCell.y + targetCell.height) - (task.y + task.height));
        }
        tasks.forEach((value: Task)=> value.calcOverlapping(tasks));
        setTasks([...tasks]);
    }

    return (
        <div className="day-view" 
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
            {daysList}
            {tasksList}
        </div>
    );
}

export default Calendar;
