import React, {RefObject, useState, useEffect} from 'react';
import {Hour, Cell} from './day';
import {CellInfo} from './calendar';
import {TaskState} from '../../store/tasks';
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
    color: string;
    zIndex: number;

    grabbed(startPos: Position): void;
    resize(startPos: Position, direction: ResizeDir): void;
}

export class Position {
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
    x: number;
    y: number;
}

export class Task {
    id: string;

    x: number = 0;
    y: number = 0;
    width: number = 0;
    height: number = 0;
    color: string;
    zIndex: number = 0;
    padding: number = 0;

    day: number;
    startTime: string;
    endTime: string;

    minHeight: number = parseFloat(getComputedStyle(document.documentElement).fontSize);

    constructor(id: string, date: Date, startTime: string, endTime: string, color: string) {
        this.id = id;
        this.day = (date.getDay() === 0) ? 6 : date.getDay() - 1;
        this.startTime = startTime;
        this.endTime = endTime;
        this.color = color;
    }

    addPadding() {
        this.padding += parseFloat(getComputedStyle(document.documentElement).fontSize) / 2;
    }

    getLeftPadding(): number {
        return 3 * parseFloat(getComputedStyle(document.documentElement).fontSize) + this.padding;
    }

    getRightPadding(): number {
        return this.padding;
    }

    getDate(baseDate: Date): Date {
        const msInDay = 1000 * 60 * 60 * 24;
        return new Date(baseDate.getTime() + this.day * msInDay);
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

    getHour(time: string): number | undefined {
        if(time === undefined) { return undefined; }
        const values = time.split(":");
        if(values.length === 0) { return undefined; }
        return parseInt(values[0]);
    }

    getHourQuarter(time: string): number | undefined {
        if(time === undefined) { return undefined; }
        const values = time.split(":");
        if(values.length < 2) { return undefined; }
        return parseInt((parseInt(values[1]) / 15).toFixed());
    }

    updateTime(day: number, startHour: number, startQuarter: number, endHour: number, endQuarter: number) {
        this.day = day;
        this.startTime = `${startHour}:${startQuarter * 15}`;
        this.endTime = `${endHour}:${endQuarter * 15}`;
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

    init(weekView: Map<number, Map<number, CellInfo[]>>) {
        //const day = weekView.days.find((day: DayState)=>{ return day.day === this.day; });
        const day = weekView.get(this.day);
        if(day === undefined) { return; }
        //const startHour = day.hours.find((hour: HourState)=>{ return hour.hour === this.getHour(this.startTime); });
        const startHourValue = this.getHour(this.startTime);
        if(startHourValue === undefined) { return; }
        const startHour = day.get(startHourValue);
        if(startHour === undefined) { return; }
        const startCell = startHour.find((cell: CellInfo)=>{ return cell.quarter === this.getHourQuarter(this.startTime); });
        if(startCell === undefined) { return; }
        const pos = new Position(startCell.x, startCell.y);
        const width = startCell.width;
        this.x = pos.x;
        this.y = pos.y;
        this.width = width;

        const endHourValue = this.getHour(this.endTime);
        if(endHourValue === undefined) { return; }
        // const endHour = day.hours.find((hour: HourState)=>{ return hour.hour === this.getHour(this.endTime); });
        const endHour = day.get(endHourValue);
        if(endHour === undefined) { return; }
        const endCell = endHour.find((cell: CellInfo)=>{ return cell.quarter === this.getHourQuarter(this.endTime); });
        if(endCell === undefined) { return; }
        const endPos = new Position(endCell.x, endCell.y);
        this.height = endPos.y - pos.y;
    }

    toTaskState(baseDate: Date): TaskState {
        return {id: this.id, day: this.getDate(baseDate).toISOString(), startTime: this.startTime, endTime: this.endTime, basicInfo: "", description: "", category: this.color};
    }
}

function CalendarTask(props: Props) {
    const padding = 0.3 * parseFloat(getComputedStyle(document.documentElement).fontSize);
    return (
        <>
        <div className="bar" style={{left: props.left, top: props.top, width: props.width, zIndex: props.zIndex + 1}} 
            onMouseDown={(event)=>{
                props.resize(new Position(event.pageX, event.pageY), ResizeDir.up);
            }}
        />
        <div className="task" style={{top: props.top, left: props.left, width: props.width, height: props.height, backgroundColor: props.color, zIndex: props.zIndex}} 
            onMouseDown={(event)=>{
                props.grabbed(new Position(event.pageX, event.pageY));
            }}
        />
        <div className="bar" style={{left: props.left, top: props.top + props.height - padding, width: props.width, zIndex: props.zIndex + 1}}
            onMouseDown={(event)=>{
                props.resize(new Position(event.pageX, event.pageY), ResizeDir.down);
            }}
        />
        </>
    );
}

export default CalendarTask;
