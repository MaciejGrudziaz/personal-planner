import {check, areAllCorrect} from "../utils/type-checking";

export interface Config {
    calendarMonthView: CalendarMonthView;
}

interface CalendarMonthView {
    fontSize: number;
}

export function parseConfig(rows: any[]): Config {
    const initialState = {
        calendarMonthView: { fontSize: 12 },
    };

    rows.forEach((val: any)=>{
        const name = val["name"] as string;
        if(check(name).not.isString.result) {
            return;
        }
        switch(name) {
            case "calendarMonthView_fontSize":
                const fontSize = val["val_i"] as number;
                if(check(fontSize).not.isNumber.result) {
                    return;
                }
                initialState.calendarMonthView.fontSize = fontSize;
                break;
            default:
                return;
        }
    });

    return initialState;
}

