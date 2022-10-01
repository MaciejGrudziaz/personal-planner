import {areAllCorrect, check} from "../utils/type-checking";

export interface Task {
    id: number;
    start_time: TaskTime | null;
    end_time: TaskTime | null;
    date: TaskDate;
    basic_info: string;
    description: string;
    category: Category;
    repetition: TaskRepetition | null;
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

export type RepetitionType = "daily" | "weekly" | "monthly" | "yearly";

export interface TaskRepetition {
    type: RepetitionType;
    count: number;
}

export function mapRepetitionTypeId(type: number): RepetitionType | undefined {
    switch(type) {
        case 0: return "daily";
        case 1: return "weekly";
        case 2: return "monthly";
        case 3: return "yearly";
    }
    return undefined;
}

export function mapRepetitionType(type: RepetitionType): number {
    switch(type) {
        case "daily": return 0;
        case "weekly": return 1;
        case "monthly": return 2;
        case "yearly": return 3;
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

export function taskDateFromDate(date: Date): TaskDate {
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

    if(!areAllCorrect([check(id).isNumber, check(categoryId).isNumber, check(date).isDate])) {
        console.log("One of mandatory values ('id', 'category', 'date') is null or undefined");
        return undefined;
    }

    const category = mapCategoryId(categoryId);
    if(category === undefined) {
        console.log(`Unrecognized category '${categoryId}'`);
        return undefined;
    }

    const start_time = value["start_time"] as string | null;
    const end_time = value["end_time"] as string | null;
    const basic_info = value["basic_info"] as string | null;
    const description = value["description"] as string | null;
    if(!areAllCorrect([
        check(start_time).isString.or.isNull,
        check(end_time).isString.or.isNull,
        check(basic_info).isString.or.isNull,
        check(description).isString.or.isNull
    ])) {
        console.log("One of values 'start_time', 'end_time', 'basic_info' or 'description' has wrong value type");
        return undefined;
    }

    return {
        id: id,
        start_time: (start_time) ? taskTimeFromString(start_time) : null,
        end_time: (end_time) ? taskTimeFromString(end_time) : null,
        date: taskDateFromDate(date),
        basic_info: (basic_info) ? basic_info : "",
        description: (description) ? description : "",
        category: category,
        repetition: null
    };
}

function exists(val: any): boolean {
    return val !== null && val !== undefined;
}

