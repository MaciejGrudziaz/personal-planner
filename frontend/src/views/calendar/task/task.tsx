import React, {RefObject, useState, useEffect} from 'react';
import {DayCellStore, CellInfo} from './../calendar';
import {TaskDate, TaskState, TaskTime, TaskCategory, TaskRepetition} from '../../../store/tasks';
import './task.css';

export enum ResizeDir {
    up,
    down
}

interface Props {
    top: number;
    left: number;
    width: number;
    height: number;
    category: TaskCategory;
    basicInfo: string;
    zIndex: number;

    grabbed(startPos: Position): void;
    resize(startPos: Position, direction: ResizeDir): void;
    selected(): void;
    deleteTask(): void;
}

export class Position {
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
    x: number;
    y: number;
}

export function getAbsDate(dayOfWeek: number, baseDate: Date): TaskDate {
    const msInDay = 1000 * 60 * 60 * 24;
    const date = new Date(baseDate.getTime() + dayOfWeek * msInDay);
    return {year: date.getFullYear(), month: date.getMonth(), day: date.getDate()};
}

export class Task {
    id: string;

    x: number = 0;
    y: number = 0;
    width: number = 0;
    height: number = 0;
    zIndex: number = 0;
    padding: number = 0;

    dayOfWeek: number;
    startTime: TaskTime | undefined;
    endTime: TaskTime | undefined;

    taskId: string;
    basicInfo: string;
    description: string;
    category: TaskCategory;
    repetition: TaskRepetition | undefined;

    minHeight: number = parseFloat(getComputedStyle(document.documentElement).fontSize);

    get isDaily(): boolean {
        return this.startTime === undefined || this.endTime === undefined;
    }

    setDaily(day: number) {
        this.dayOfWeek = day;
        this.startTime = undefined;
        this.endTime = undefined;
        this.x = 0;
        this.y = 0;
        this.width = 0;
        this.height = 0;
    }

    constructor(id: string, date: Date, basicInfo: string, description: string, category: TaskCategory, repetition?: TaskRepetition, startTime?: TaskTime, endTime?: TaskTime) {
        this.id = `${id}_${date.getTime()}`;
        this.taskId = id;
        this.dayOfWeek = (date.getDay() === 0) ? 6 : date.getDay() - 1;
        this.startTime = startTime;
        this.endTime = endTime;
        this.basicInfo = basicInfo;
        this.description = description;
        this.category = category;
        this.repetition = repetition;
    }

    addPadding() {
        this.padding += this.minHeight / 2;
    }

    getLeftPadding(): number {
        return 3 * this.minHeight + this.padding;
    }

    getRightPadding(): number {
        return this.padding;
    }

    getDate(baseDate: Date): TaskDate {
        return getAbsDate(this.dayOfWeek, baseDate);
    }

    setPosition(position: Position) {
        this.x = position.x;
        this.y = position.y;
    }

    move(diff: Position) {
        this.x += diff.x;
        this.y += diff.y;
    }

    resizeUp(diff: number) {
        this.y += diff;
        this.height -= diff;
        if(this.height < this.minHeight) {
            this.height = this.minHeight;
        }
    }

    resizeDown(diff: number) {
        this.height += diff;
        if(this.height < this.minHeight) {
            this.height = this.minHeight;
        }
    }

    getHourQuarter(time: TaskTime | undefined): number | undefined {
        if(time === undefined) { return undefined; }
        return Math.floor(time.minute / 15);
    }

    updateTime(dayOfWeek: number, startHour: number, startQuarter: number, endHour: number, endQuarter: number) {
        this.dayOfWeek = dayOfWeek;
        this.startTime = {hour: startHour, minute: startQuarter * 15};
        this.endTime = {hour: endHour, minute: endQuarter * 15};
    }

    calcOverlapping(tasks: Task[]): boolean {
        this.padding = 0;
        let zIndexChanged = false;
        tasks.forEach((task: Task)=>{
            if(task.id === this.id) { return; }
            if(this.x > task.x - this.minHeight / 10 && this.x < task.x + task.width + this.minHeight / 10) {
                if(this.y < task.y - this.minHeight / 10 || this.y > task.y + task.height - this.minHeight / 10) { return; }
                if(this.y > task.y - this.minHeight /2 && this.y < task.y + this.minHeight /2 && this.height > task.height) { return; }
                this.addPadding();
                if(this.zIndex > task.zIndex) { return; }
                zIndexChanged = true;
                this.zIndex = task.zIndex + 1;

            }
        });
        return zIndexChanged;
    }

    init(weekView: Map<number, DayCellStore>) {
        if(this.startTime === undefined || this.endTime === undefined) { return; }

        const day = weekView.get(this.dayOfWeek);
        if(day === undefined) { return; }
        const startHour = day.hourlyRefs.get(this.startTime.hour);
        if(startHour === undefined) { return; }
        const startCell = startHour.find((cell: CellInfo)=>{ return cell.quarter === this.getHourQuarter(this.startTime); });
        if(startCell === undefined) { return; }
        const pos = new Position(startCell.x, startCell.y);
        const width = startCell.width;

        const startCellEl = startCell.ref.current;
        if(startCellEl === null) { return; }

        this.x = pos.x;
        this.y = pos.y;
        this.width = width;
        this.minHeight = parseFloat(getComputedStyle(startCellEl).fontSize);

        const endHour = day.hourlyRefs.get(this.endTime.hour);
        if(endHour === undefined) { return; }
        const endCell = endHour.find((cell: CellInfo)=>{ return cell.quarter === this.getHourQuarter(this.endTime); });
        if(endCell === undefined) { return; }
        const endPos = new Position(endCell.x, endCell.y);
        this.height = endPos.y - pos.y;
    }

    toTaskState(baseDate: Date): TaskState {
        return {id: this.taskId, date: this.getDate(baseDate), startTime: this.startTime, endTime: this.endTime, basicInfo: this.basicInfo, description: this.description, category: this.category, repetition: this.repetition};
    }
}

export function getColor(category: TaskCategory): string {
    switch(category) {
        case "simple":
            return "#e9c46a";
        case "important":
            return "#e76f51";
    }
}

export function getBorderColor(category: TaskCategory): string {
    switch(category) {
        case "simple":
            return "#926F16";
        case "important":
            return "#621E0D";
    }
}

function CalendarTask(props: Props) {
    const [clickRecorded, setClickRecord] = useState(false);
    const [mouseClickStartPos, setMouseClickStartPos] = useState(undefined as Position | undefined);

    const resetClick = () => {
        setClickRecord(false);
    }

    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);

    const calcLength =(a: Position, b: Position) => {
        const x = a.x - b.x;
        const y = a.y - b.y;
        return Math.sqrt(x*x + y*y);
    }

    return (
        <>
        <div className="bar" style={{left: props.left, top: props.top, width: props.width, zIndex: props.zIndex + 1}} 
            onMouseDown={(event: React.MouseEvent<HTMLDivElement>)=>{
                props.resize(new Position(event.pageX, event.pageY), ResizeDir.up);
            }}
        />
        <div className="task" style={{top: props.top, left: props.left, width: props.width, height: props.height, borderColor: getBorderColor(props.category), backgroundColor: getColor(props.category), zIndex: props.zIndex}} 
            onMouseDown={(event: React.MouseEvent<HTMLDivElement>)=>{
                setMouseClickStartPos({x: event.pageX, y: event.pageY});
            }}
            onMouseUp={()=>setMouseClickStartPos(undefined)}
            onMouseMove={(event: React.MouseEvent<HTMLDivElement>)=>{
                if(mouseClickStartPos === undefined) {
                    return;
                }
                if(calcLength(mouseClickStartPos, {x: event.pageX, y: event.pageY}) < rem) {
                    return;
                }
                props.grabbed(new Position(event.pageX, event.pageY));
                setMouseClickStartPos(undefined);
            }}
            onClick={()=>{
                if(clickRecorded) {
                    if(props.selected) {
                        props.selected();
                    }
                    resetClick();
                    return;
                }
                setClickRecord(true);
                setTimeout(resetClick, 500);
            }}
        >
            {props.basicInfo}
            <button className="task-btn" onClick={()=>props.deleteTask()}>X</button>
        </div>
        <div className="bar" style={{left: props.left, top: props.top + props.height, width: props.width, zIndex: props.zIndex + 1}}
            onMouseDown={(event: React.MouseEvent<HTMLDivElement>)=>{
                props.resize(new Position(event.pageX, event.pageY), ResizeDir.down);
            }}
        />
        </>
    );
}

export default CalendarTask;
