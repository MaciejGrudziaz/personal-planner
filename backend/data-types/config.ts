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
        const name = val["name"];
        if(name === undefined || name === null) {
            return;
        }
        switch(name) {
            case "calendarMonthView_fontSize":
                const fontSize = val["val_i"] as number;
                if(fontSize === undefined || fontSize === null) { return; }
                initialState.calendarMonthView.fontSize = fontSize;
                break;
            default:
                return;
        }
    });

    return initialState;
}

