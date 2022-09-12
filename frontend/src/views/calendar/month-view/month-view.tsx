import React, {useState, useEffect} from 'react';
import './month-view.scss';

interface Props {
    x: number;
    y: number;
    day?: number;
    month?: number;
    year?: number;
    selectDay?(date: number, month: number, year: number): void;
}

function translateDay(isoDay: number): number {
    if(isoDay === 0) {
        return 6;
    }
    return isoDay - 1;
}

function CalendarMonthView(props: Props) {
    const [day, setDay] = useState(undefined as undefined | number);
    const [month, setMonth] = useState(undefined as undefined | number);
    const [year, setYear] = useState(undefined as undefined | number);

    useEffect(()=>{
        if(props.month) {
            setMonth(props.month);
        }
        if(props.year) {
            setYear(props.year);
        }
        if(props.day) {
            setDay(props.day);
        }
    }, [props.month, props.year]);

    const updateCalendarState = (newMonth: number, newYear: number) => {
        setMonth(newMonth);
        setYear(newYear);
        if(newMonth === props.month && newYear === props.year) {
            setDay(props.day);
            return;
        }
        setDay(undefined);
    }

    const selectPreviousYear = () => {
        if(month === undefined || year === undefined) { return; }
        updateCalendarState(month, year - 1);
    }

    const selectPreviousMonth = () => {
        if(month === undefined || year === undefined) { return; }
        if(month === 0) {
            updateCalendarState(11, year - 1);
            return;
        }
        updateCalendarState(month - 1, year);
    }

    const selectNextYear = () => {
        if(month === undefined || year === undefined) { return; }
        updateCalendarState(month, year + 1);
    }

    const selectNextMonth = () => {
        if(month === undefined || year === undefined) {
            return;
        }
        if(month === 11) {
            updateCalendarState(0, year + 1);
            return;
        }
        updateCalendarState(month + 1, year);
    }

    const selectDate = (date: number) => {
        if(month === undefined || year === undefined || props.selectDay === undefined) {
            return;
        }
        props.selectDay(date, month, year);
    }

    const weeks = ()=>{
        if(month === undefined || year === undefined) {
            const now = new Date(Date.now());
            setMonth(now.getMonth());
            setYear(now.getFullYear());
            return;
        }
        const msInDay = 1000 * 60 * 60 * 24;
        const beginMonth = new Date(year, month, 1);
        const endMonth = new Date(new Date(year, month + 1, 1).getTime() - msInDay);
        const offset = translateDay(beginMonth.getDay());
        const weekMap = new Map() as Map<number, number[]>;
        for(let i = beginMonth.getDate(); i <= endMonth.getDate(); i+=1) {
            const weekId = Math.floor(((i - 1) + offset) / 7);
            const week = weekMap.get(weekId);
            if(week === undefined) {
                weekMap.set(weekId, [i]);
            } else {
                week.push(i);
            }
        }
        const firstWeek = weekMap.get(0);
        if(firstWeek === undefined) {
            return (<></>);
        }
        weekMap.set(0, new Array(offset).fill(-1).concat(firstWeek));

        return Array.from(weekMap.values()).map((days: number[], id: number)=> (
            <div className="week-row" key={id}>
                {daysView(days)}
            </div>
        ));
    };

    const daysView = (days: number[])=>{
        return days.map((val: number, id: number)=>{
            if(val === -1) {
                return (
                    <div className="empty-cell" key={id}/>
                );
            }
            if(val === day) {
                return (
                    <div className="day-cell" key={id} style={{backgroundColor: "red"}} onClick={()=>selectDate(val)}>{val}</div>
                );
            }
            return (
                <div className="day-cell" key={id} onClick={()=>selectDate(val)}>{val}</div>
            );
        });
    }

    const headersView = ()=>{
        return ["mon", "tue", "wed", "thu", "fri", "sat", "sun"].map((val: string, id: number)=>(
            <div key={id} className="header-cell">{val}</div>
        ));
    }

    return (
        <div className="month-view" style={{top: props.y, left: props.x}} onClick={(e: React.MouseEvent<HTMLDivElement>)=>e.stopPropagation()}>
            <div className="title-row">
                <button onClick={selectPreviousYear}>&lt;&lt;</button>
                <button onClick={selectPreviousMonth}>&lt;</button>
                <div className="month-title">{(month === undefined) ? "" : month + 1}/{year}</div>
                <button onClick={selectNextMonth}>&gt;</button>
                <button onClick={selectNextYear}>&gt;&gt;</button>
            </div>
            <div className="week-row">
                {headersView()}
            </div>
            {weeks()}
        </div>
    );
}

export default CalendarMonthView;

