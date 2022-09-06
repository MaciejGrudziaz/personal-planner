import React, {RefObject, useEffect, useState, useRef} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {Position} from './task';
import HourView from './hour';
import './day.css';

interface Props {
    day: number;
    dayName: string;
    date: Date;
    updateRefs(hour: number, refs: RefObject<HTMLDivElement>[]): void;
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
        //this.ref = React.createRef();
    }

    quarter: number;
    position: Position | undefined;
    width: number | undefined;
    height: number | undefined;
    //ref: RefObject<HTMLDivElement>;

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
    const startHour = 4;
    const hours = Array.from(Array(24).keys()).splice(startHour);

    const hoursList = hours.map((hour: number) => {
        return (<HourView day={props.day} hour={hour} updateRefs={(refs: RefObject<HTMLDivElement>[])=>{
            props.updateRefs(hour, refs);
        }} />)
    });

    const getDate = (): string => {
        const day = props.date.getDate();
        const month = props.date.getMonth() + 1;
        return `${day}.${(month < 10) ? '0' + month : month}`;
    }

    return (
        <div className="day">
            <div style={{fontSize: "1rem"}}><b>{props.dayName}</b> {getDate()}</div>
            <div>
                {hoursList}
            </div>
        </div>
    );
}

export default Day;
