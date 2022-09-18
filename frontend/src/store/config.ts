import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface CalendarMonthView {
    fontSize: number;
}

export interface Config {
    calendarMonthView: CalendarMonthView;
}

const initialState = {
    calendarMonthView: { fontSize: 12 },
} as Config;

export const configSlice = createSlice({
    name: "config",
    initialState,
    reducers: {
        initConfig: (state, action: PayloadAction<Config>) => {
            return action.payload;
        },
        updateCalendarViewFontSize: (state, action: PayloadAction<number>)=> {
            const size = action.payload;
            return {...state, calendarMonthView: {...state.calendarMonthView, fontSize: size}};
        },
    }
});

export const { updateCalendarViewFontSize, initConfig } = configSlice.actions;

export default configSlice.reducer;

