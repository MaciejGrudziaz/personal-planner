import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Position } from '../views/calendar/task';

export interface CellInfo {
    day: number;
    hour: number;
    quarter: number;
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface CellState {
    quarter: number;
    x: number;
    y: number;
    width: number;
    height: number;
}

export function isPointInsideCell(cell: CellState, point: Position) {
    return point.x >= cell.x && point.x <= cell.x + cell.width
        && point.y >= cell.y && point.y <= cell.y + cell.height;
}

export interface HourState {
    hour: number;
    cells: CellState[];
}

export interface DayState {
    day: number;
    hours: HourState[];
}

export interface WeekViewState {
    startDate: Date | undefined;
    endDate: Date | undefined;
    days: DayState[];
}

const initialState: WeekViewState = {
    startDate: undefined,
    endDate: undefined,
    days: []
}

export const weekViewSlice = createSlice({
    name: "weekView",
    initialState,
    reducers: {
        updateCells: (state, action: PayloadAction<CellInfo[]>) => {
            console.log('cell update');
            const cellsInfo = action.payload;
            cellsInfo.forEach((cellInfo: CellInfo)=>{
                let day = state.days.find((value: DayState)=> { return value.day === cellInfo.day; });
                if(day === undefined) {
                    const newLen = state.days.push({day: cellInfo.day, hours: []});
                    day = state.days[newLen - 1];
                }
                let hour = day.hours.find((value: HourState)=>{ return value.hour === cellInfo.hour; });
                if(hour === undefined) {
                    const newLen = day.hours.push({hour: cellInfo.hour, cells: []});
                    hour = day.hours[newLen - 1];
                }
                const cell = hour.cells.find((value: CellState)=>{ return value.quarter === cellInfo.quarter; });
                if(cell === undefined) {
                    hour.cells.push({quarter: cellInfo.quarter, x: cellInfo.x, y: cellInfo.y, width: cellInfo.width, height: cellInfo.height});
                } else {
                    cell.x = cellInfo.x;
                    cell.y = cellInfo.y;
                    cell.height = cellInfo.height;
                    cell.width = cellInfo.width;
                }
            });
        }
    }
})

export const { updateCells } = weekViewSlice.actions;

export default weekViewSlice.reducer;

