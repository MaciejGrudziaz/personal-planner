import React, {RefObject, useEffect, useState, useRef} from 'react';
import {getDefaultBackgroundColor, getDefaultBorderColor, Position} from './task/task';
import {TaskState} from '../../store/tasks';
import {Category} from '../../store/categories';
import HourView, {CellBasicInfo} from './hour';
import {useDeleteTask} from '../../gql-client/tasks/delete';
import {useStore} from 'react-redux';
import {RootState} from '../../store/store';
import './day.scss';

interface Props {
    day: number;
    dayName: string;
    date: Date;
    maxDailyTasksInWeekPerDay?: number;
    selectedCells: CellBasicInfo[];
    dailyTasks: TaskState[];
    updateRefs(hour: number, refs: RefObject<HTMLDivElement>[]): void;
    updateDayRef?(ref: RefObject<HTMLDivElement>): void;
    startSelection(day: number, hour: number, quarter: number): void;
    endSelection(day: number, hour: number, quarter: number): void;
    hoverOverCell(day: number, hour: number, quarter: number): void;
    moveTask(task: TaskState, mousePos: Position, x: number, y: number, width: number, height: number): void;
    onGridSizeChange?(): void;
    select?(task: TaskState): void;
    createDailyTask?(): void;
    deleteTask?(task: TaskState): void;
}

export class Cell {
    constructor(quarter: number, ref: RefObject<HTMLDivElement> | null) {
        this.quarter = quarter;
        if(ref === null) { return; }
        const el = ref.current;
        if(el === null) {
            return;
        }
        this.position = new Position(el.offsetLeft, el.offsetTop);
        this.width = el.offsetWidth;
        this.height = el.offsetHeight;
    }

    quarter: number;
    position: Position | undefined;
    width: number | undefined;
    height: number | undefined;

    isInside(pos: Position): boolean {
        if(this.position === undefined || this.width === undefined || this.height === undefined) { return false; }
        return pos.x >= this.position.x && pos.x <= this.position.x + this.width
            && pos.y >= this.position.y && pos.y <= this.position.y + this.height;
    }

    getPosition(): Position | undefined {
        if(this.position === undefined) { return undefined; }
        return new Position(this.position.x + 3.2 * parseFloat(getComputedStyle(document.documentElement).fontSize), this.position.y);
    }

    getLowerPosition(): Position | undefined {
        if(this.height === undefined) { return undefined; }
        const pos = this.getPosition();
        if(pos === undefined) { return undefined; }
        return new Position(pos.x, pos.y + this.height);
    }
}

export class Hour {
    constructor(hour: number) {
        this.value = hour;
        this.cells = [new Cell(0, null), new Cell(1, null), new Cell(2, null), new Cell(3, null)];
    }

    value: number;
    cells: Cell[];
}

function Day(props: Props) {
    const [mouseClickStartPos, setMouseClickStartPos] = useState(undefined as Position | undefined);
    const [clickRecorded, setClickRecord] = useState(false);
    const [isInitialized, setInit] = useState(false);
    const dailyTasksRef = useRef() as RefObject<HTMLDivElement>;
    const [categories, setCategories] = useState([] as Category[]);
    const store = useStore();

    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);

    useEffect(()=>{
        if(isInitialized) return;
        if(props.updateDayRef) props.updateDayRef(dailyTasksRef);
        store.subscribe(fetchCategories);
        fetchCategories();
        setInit(true);
    });

    useEffect(()=>{
        if(props.onGridSizeChange) {
            props.onGridSizeChange();
        }
    }, [props.maxDailyTasksInWeekPerDay]);

    const startHour = 4;
    const hours = Array.from(Array(24).keys()).splice(startHour);

    const getDate = (): string => {
        const day = props.date.getDate();
        const month = props.date.getMonth() + 1;
        return `${day}.${(month < 10) ? '0' + month : month}`;
    }

    const hoursList = hours.map((hour: number) => (
        <HourView key={hour} day={props.day} hour={hour} selectedCells={props.selectedCells}
            updateRefs={(refs: RefObject<HTMLDivElement>[])=>props.updateRefs(hour, refs)}
            startSelection={(day: number, hour: number, quarter: number)=>props.startSelection(day, hour, quarter)}
            endSelection={(day: number, hour: number, quarter: number)=>props.endSelection(day, hour, quarter)}
            hoverOverCell={(day: number, hour: number, quarter: number)=>props.hoverOverCell(day, hour, quarter)}
        />
    ));

    const resetClick = () => {
        setClickRecord(false);
    };

    const calcLength = (a: Position, b: Position) => {
        const x = a.x - b.x;
        const y = a.y - b.y;
        return Math.sqrt(x*x + y*y);
    }

    const fetchCategories = () => {
        setCategories((store.getState() as RootState).categoryState);
    }

    const getBackgroundColor = (name: string | undefined): string => {
        const category = categories.find((val: Category) => val.name === name);
        return (category === undefined) ? getDefaultBackgroundColor() : category.backgroundColor;
    }

    const getBorderColor = (name: string | undefined): string => {
        const category = categories.find((val: Category) => val.name === name);
        return (category === undefined) ? getDefaultBorderColor() : category.borderColor;
    }

    const dailyTasks = props.dailyTasks.map((task: TaskState) => (
        <div key={task.id} className="day-daily-task" style={{backgroundColor: getBackgroundColor(task.category), borderColor: getBorderColor(task.category)}}
            onMouseDown={(e: React.MouseEvent<HTMLDivElement>) => {
                setMouseClickStartPos(new Position(e.clientX, e.clientY));
            }}
            onMouseUp={()=>setMouseClickStartPos(undefined)}
            onClick={(event: React.MouseEvent<HTMLDivElement>) => {
                if(clickRecorded) {
                    if(props.select) {
                        props.select(task);
                    }
                    resetClick();
                    return;
                }
                setClickRecord(true);
                setTimeout(resetClick, 500);
            }}
            onMouseMove={(e: React.MouseEvent<HTMLDivElement>)=>{
                if(mouseClickStartPos === undefined) return;
                if(calcLength(mouseClickStartPos, new Position(e.clientX, e.clientY)) < rem) return;
                setMouseClickStartPos(undefined);

                const el = dailyTasksRef.current;
                if(el === undefined || el === null) {
                    return;
                }
                const boundingRect = el.getBoundingClientRect();
                task.startTime = {hour: 0, minute: 0};
                task.endTime = {hour: 1, minute: 0};
                props.moveTask(task, new Position(e.clientX, e.clientY), boundingRect.x, e.clientY - rem, boundingRect.width, 4.0 * rem);
            }}
        >
            {task.basicInfo}
            <button className="day-daily-task-del-btn" onClick={() => {
                if(props.deleteTask) {
                    props.deleteTask(task);
                }
            }}>X</button>
        </div>
    ));

    return (
        <div className="day">
            <div className="day-header-tab">
                <div className="day-header"><b>{props.dayName}</b> {getDate()}</div>
                <button className="day-add-btn" onClick={() => {
                    if(props.createDailyTask) {
                        props.createDailyTask();
                    }
                }}>+</button>
            </div>
            <div className="day-cells-grid">
                <div ref={dailyTasksRef} className="day-daily-task-tab" 
                    style={{gridRow: (props.maxDailyTasksInWeekPerDay === undefined || props.maxDailyTasksInWeekPerDay === 0) ? 1 : `1 / ${props.maxDailyTasksInWeekPerDay + 1}`}}>
                    {dailyTasks}
                </div>
                <div style={{gridColumn: 1, gridRow: (props.maxDailyTasksInWeekPerDay === undefined || props.maxDailyTasksInWeekPerDay === 0) ? 2 : props.maxDailyTasksInWeekPerDay + 1}}>
                    {hoursList}
                </div>
            </div>
        </div>
    );
}

export default Day;
