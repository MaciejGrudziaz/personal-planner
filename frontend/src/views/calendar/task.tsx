import React, {RefObject, useState, useEffect} from 'react';
import {Hour, Cell} from './day';
import {WeekViewState, DayState, HourState, CellState} from '../../store/week-view';
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
        this.day = date.getDay();
        this.startTime = startTime;
        this.endTime = endTime;
        this.color = color;
    }

    addPadding(offset: number) {
        this.padding += parseFloat(getComputedStyle(document.documentElement).fontSize) / 2 + offset;
    }

    getLeftPadding(): number {
        return 3.25 * parseFloat(getComputedStyle(document.documentElement).fontSize) + this.padding;
    }

    getRightPadding(): number {
        return this.padding;
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

    calcOverlapping(tasks: Task[]) {
        this.padding = 0;
        tasks.forEach((task: Task)=>{
            if(task.id === this.id) { return; }
            if(this.x > task.x - this.minHeight / 10 && this.x < task.x + task.width + this.minHeight / 10) {
                if(this.y < task.y - this.minHeight / 10 || this.y > task.y + task.height - this.minHeight / 10) { return; }
                if(this.y > task.y - this.minHeight /2 && this.y < task.y + this.minHeight /2 && this.height > task.height) { return; }
                console.log(`${this.id} is inside ${task.id}`);
                const offset = (task.padding !== 0 && task.padding > this.padding) ? task.padding - this.padding : 0;
                this.addPadding(offset);
                if(this.zIndex > task.zIndex) { return; }
                this.zIndex = task.zIndex + 1;

            }
        });
    }

    init(weekView: WeekViewState) {
        const day = weekView.days.find((day: DayState)=>{ return day.day === this.day; });
        if(day === undefined) { return; }
        const startHour = day.hours.find((hour: HourState)=>{ return hour.hour === this.getHour(this.startTime); });
        if(startHour === undefined) { return; }
        const startCell = startHour.cells.find((cell: CellState)=>{ return cell.quarter === this.getHourQuarter(this.startTime); });
        if(startCell === undefined) { return; }
        const pos = new Position(startCell.x, startCell.y);
        const width = startCell.width;
        this.x = pos.x;
        this.y = pos.y;
        this.width = width;

        const endHour = day.hours.find((hour: HourState)=>{ return hour.hour === this.getHour(this.endTime); });
        if(endHour === undefined) { return; }
        const endCell = endHour.cells.find((cell: CellState)=>{ return cell.quarter === this.getHourQuarter(this.endTime); });
        if(endCell === undefined) { return; }
        const endPos = new Position(endCell.x, endCell.y);
        this.height = endPos.y - pos.y;
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
