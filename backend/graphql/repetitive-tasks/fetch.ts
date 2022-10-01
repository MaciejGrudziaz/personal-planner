import { DBClient } from "../../db-client/client";
import { RepetitiveTask, parseRepetitiveTask } from "./types";
import { RepetitionType, Task } from "../../data-types/task";

export interface TaskRepetitonSummary {
    id: number;
    date: Date;
    type: RepetitionType;
    count: number;
}

export async function fetchRepetitiveTasks(db: DBClient, start_date: Date, end_date: Date): Promise<TaskRepetitonSummary[] | null> {
    const fetchRepetitiveTasksQuery = {
        name: "fetch-repetitive-tasks-query",
        text: `
            SELECT 
                rt.id,
                rt.type,
                rt.count,
                t.date as start_date,
                rt.end_date
            FROM repetitive_tasks rt
            INNER JOIN tasks t
                ON t.id = rt.id
            WHERE t.date < $2 AND
                (rt.end_date >= $1 OR rt.end_date IS NULL)
        `,
        values: [start_date, end_date]
    };

    const client = await db.connect();
    try {
        const res = await client.query(fetchRepetitiveTasksQuery);
        return calcRepetitiveTasksDatesForDateRange(start_date, end_date, 
            res.rows
                .map((val: any) => parseRepetitiveTask(val))
                .filter((val: RepetitiveTask | undefined) => val !== undefined)
                .map((val: RepetitiveTask | undefined) => val!)
        );
    } catch(err: any) {
        console.error(err.stack);
    } finally {
        client.release();
    }
    return null;
}

function calcEventIterationBegin(start_date: number, end_date: number, event_begin: number, diff: number): number | undefined {
    if(event_begin > end_date) {
        return undefined;
    }
    if(event_begin > start_date) {
        return 0;
    }
    const diffBeforeStartDate = start_date - event_begin;
    const beginIt = parseInt((diffBeforeStartDate / diff).toFixed());
    return (event_begin + beginIt * diff) < start_date ? beginIt + 1 : beginIt;
}

function calcEventIterationEnd(start_date: number, end_date: number, event_begin: number, event_end: number | null, diff: number): number | undefined {
    if(event_begin > end_date) {
        return undefined;
    }
    if(event_end !== null && event_end < start_date) {
        return undefined;
    }
    const diffBeforeEndDate = end_date - event_begin;
    const endIt = parseInt((diffBeforeEndDate / diff).toFixed());
    return (event_begin + endIt * diff) > end_date ? endIt - 1 : endIt;
}

function calcOccurences(start_date: number, end_date: number, event_begin: number, event_end: number | null, diff: number): number[] {
    const firstIt = calcEventIterationBegin(start_date, end_date, event_begin, diff);
    const lastIt = calcEventIterationEnd(start_date, end_date, event_begin, event_end, diff);
    if(firstIt === undefined || lastIt === undefined) {
        return [];
    }
    const result = [];
    for(let it = firstIt; it <= lastIt; it += 1) {
        result.push(event_begin + it * diff);
    }
    return result;
}

function getDateNumericRepresentation(date: Date, repetition_type: RepetitionType): number {
    switch(repetition_type) {
        case "daily":
            return date.getTime();
        case "weekly":
            return date.getTime();
        case "monthly":
            return date.getFullYear() * 12 + date.getMonth();
        case "yearly":
            return date.getFullYear();
    }
}

function getRepetitionTypeDiff(repetition_type: RepetitionType): number {
    const msInDay = 1000 * 60 * 60 * 24;
    switch(repetition_type) {
        case "daily":
            return msInDay;
        case "weekly":
            return msInDay * 7;
        case "monthly":
            return 1;
        case "yearly":
            return 1;
    }
}

function getUTCDate(year: number, month: number, day: number): Date {
    const date = new Date();
    date.setUTCFullYear(year);
    date.setUTCMonth(month, day);
    date.setUTCHours(0);
    date.setUTCMinutes(0);
    date.setUTCSeconds(0);
    date.setUTCMilliseconds(0);
    return date;
}

function parseNumericDateToBuiltin(task: RepetitiveTask, numeric: number): Date {
    switch(task.type) {
        case "daily":
            return new Date(numeric);
        case "weekly":
            return new Date(numeric);
        case "monthly":
            const year = parseInt((numeric / 12).toFixed());
            const month = numeric - (year * 12);
            return getUTCDate(year, month, task.start_date.getDate());
        case "yearly":
            return getUTCDate(numeric, task.start_date.getMonth(), task.start_date.getDate());
    }
}

export function calcRepetitiveTasksDatesForDateRange(start_date: Date, end_date: Date, tasks: RepetitiveTask[]): TaskRepetitonSummary[] {
    const result = [] as TaskRepetitonSummary[];
    tasks.forEach((val: RepetitiveTask) => {
        const startDate = getDateNumericRepresentation(start_date, val.type);
        const endDate = getDateNumericRepresentation(end_date, val.type);
        const eventBegin = getDateNumericRepresentation(val.start_date, val.type);
        const eventEnd = (val.end_date === null) ? null : getDateNumericRepresentation(val.end_date, val.type);
        calcOccurences(startDate, endDate, eventBegin, eventEnd, val.count * getRepetitionTypeDiff(val.type)).forEach((numericDate: number) => {
            result.push({id: val.id, date: parseNumericDateToBuiltin(val, numericDate), type: val.type, count: val.count});
        });
    });
    return result;
}

