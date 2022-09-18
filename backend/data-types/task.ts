export interface Task {
    id: number;
    start_time: TaskTime | null;
    end_time: TaskTime | null;
    date: TaskDate;
    basic_info: string;
    description: string;
    category: Category;
}

type Category = "simple" | "important";

function mapCategoryId(category: number): Category | undefined {
    switch(category) {
        case 0: return "simple";
        case 1: return "important";
    }
    return undefined;
}

export function mapCategory(category: Category): number {
    switch(category) {
        case "simple":
            return 0;
        case "important":
            return 1;
    }
}

interface TaskTime {
    hour: number;
    minute: number;
}

export function taskTimeToString(time: TaskTime | null): string | null{
    if(time === null) {
        return null;
    }
    return `${numToFixedString(time.hour)}:${numToFixedString(time.minute)}:00`;
}

function numToFixedString(val: number): string {
    return (val < 10) ? "0" + val.toFixed() : val.toFixed();
}

function taskTimeFromString(time: string): TaskTime | null {
    const splits = time.split(":");
    if(splits.length < 2) {
        console.log(`wrong time format ${time} (expected: hh:mm[:ss])`);
        return null;
    }
    const hour = parseInt(splits[0]);
    const minute = parseInt(splits[1]);
    if(isNaN(hour) || isNaN(minute)) {
        console.log(`wrong data format of time field: ${time}`);
        return null;
    }
    return {hour: hour, minute: minute};
}

interface TaskDate {
    year: number;
    month: number;
    day: number;
}

function taskDateFromDate(date: Date): TaskDate {
    return {year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate()};
}

export function taskDateToDate(date: TaskDate): Date {
    return new Date(date.year, date.month - 1, date.day);
}

export function taskDateToString(date: TaskDate): string {
    return `${date.year}-${numToFixedString(date.month)}-${numToFixedString(date.day)}`;
}

export function parseTask(value: any): Task | undefined {
    const id = value["id"] as number;
    const categoryId = value["category"] as number;
    const date = value["date"] as Date;
    if(!exists(id) || !exists(categoryId) || !exists(date)) {
        console.log("One of mandatory values ('id', 'category', 'date') is null or undefined");
        return undefined;
    }

    const category = mapCategoryId(categoryId);
    if(category === undefined) {
        console.log(`Unrecognized category '${categoryId}'`);
        return undefined;
    }

    return {
        id: id,
        start_time: (exists(value["start_time"])) ? taskTimeFromString(value["start_time"]) : null,
        end_time: (exists(value["end_time"])) ? taskTimeFromString(value["end_time"]) : null,
        date: taskDateFromDate(date),
        basic_info: (exists(value["basic_info"])) ? value["basic_info"] : "",
        description: (exists(value["description"])) ? value["description"] : "",
        category: category,
    };
}

function exists(val: any): boolean {
    return val !== null && val !== undefined;
}

