import { DBClient } from "../../db-client/client";
import { RepetitiveTask, parseRepetitiveTask } from "./types";
import { RepetitionType, Task, TaskTime, taskTimeFromString } from "../../data-types/task";
import { areAllCorrect, check } from "../../utils/type-checking";

export interface TaskRepetitonSummary {
    id: number;
    date: Date;
    start_time?: TaskTime | null;
    end_time?: TaskTime | null;
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
        return updateTasks(db,
            filterExcludedTasks(db,
                calcRepetitiveTasksDatesForDateRange(start_date, end_date, 
                    res.rows
                        .map((val: any) => parseRepetitiveTask(val))
                        .filter((val: RepetitiveTask | undefined) => val !== undefined)
                        .map((val: RepetitiveTask | undefined) => val!)
                )
            )
        );
    } catch(err: any) {
        console.error(err.stack);
    } finally {
        client.release();
    }
    return null;
}

export interface TaskDate {
    id: number
    date: Date;
}

function parseTaskDate(val: any): TaskDate | undefined {
    const id = val["id"] as number;
    const date = val["date"] as Date;
    if(!areAllCorrect([check(id).isNumber, check(date).isDate])) {
        return undefined;
    }
    return {id: id, date: date};
}

async function fetchExcludedRepetitiveTasks(db: DBClient, ids: number[]): Promise<TaskDate[] | null> {
    const fetchExcludedRepetitiveTasksQuery = {
        name: "fetch-excluded-repetitive-tasks-query",
        text: `
            SELECT id, date
            FROM excluded_repetitive_tasks
            WHERE id = ANY ($1)
        `,
        values: [ids]
    };

    const client = await db.connect();
    try {
        const res = await client.query(fetchExcludedRepetitiveTasksQuery);
        return res.rows
            .map((val: any) => parseTaskDate(val))
            .filter((val: TaskDate | undefined) => val !== undefined)
            .map((val: TaskDate | undefined) => val!);
    } catch(err: any) {
        console.error(err.stack);
    } finally {
        client.release();
    }
    return null;
}

async function filterExcludedTasks(db: DBClient, tasks: TaskRepetitonSummary[]): Promise<TaskRepetitonSummary[] | null> {
    const ids = new Set() as Set<number>;
    tasks.forEach((task: TaskRepetitonSummary) => ids.add(task.id));
    const excludedTasks = await fetchExcludedRepetitiveTasks(db, Array.from(ids.values()));
    if(excludedTasks === null) {
        return null;
    }
    return tasks.filter((task: TaskRepetitonSummary) => {
        const excludedTask = excludedTasks.find((val: TaskDate) => val.id === task.id && val.date.getTime() === task.date.getTime());
        return excludedTask === undefined;
    });
}

interface TaskDateTime {
    id: number;
    date: Date;
    startTime: TaskTime | null;
    endTime: TaskTime | null;
}

function parseTaskDateTime(val: any): TaskDateTime | undefined {
    const id = val["id"] as number;
    const date = val["date"] as Date;
    const startTime = val["start_time"] as string | null;
    const endTime = val["end_time"] as string | null;

    if(!areAllCorrect([check(id).isNumber, check(date).isDate, check(startTime).isString.or.isNull, check(endTime).isString.or.isNull])) {
        return undefined;
    }

    return {
        id: id,
        date: date,
        startTime: (startTime !== null) ? taskTimeFromString(startTime) : null,
        endTime: (endTime !== null) ? taskTimeFromString(endTime) : null
    };
}

async function fetchUpdatedRepetitiveTasks(db: DBClient, ids: number[]): Promise<TaskDateTime[] | null> {
    const fetchUpdatedRepetitiveTasksQuery = {
        name: "fetch-updated-repetitive-tasks-query",
        text: `
            SELECT id, date, start_time, end_time
            FROM changed_repetitive_tasks
            WHERE id = ANY ($1)
        `,
        values: [ids]
    };

    const client = await db.connect();
    try {
        const res = await client.query(fetchUpdatedRepetitiveTasksQuery);
        return res.rows
            .map((val: any) => parseTaskDateTime(val))
            .filter((val: TaskDateTime | undefined) => val !== undefined)
            .map((val: TaskDateTime | undefined) => val!);
    } catch(err: any) {
        console.error(err.stack);
    } finally {
        client.release();
    }
    return null;
}

async function updateTasks(db: DBClient, tasksPromise: Promise<TaskRepetitonSummary[] | null>): Promise<TaskRepetitonSummary[] | null> {
    const tasks = await tasksPromise;
    if(tasks === null) {
        return null;
    }

    const ids = new Set() as Set<number>;
    tasks.forEach((task: TaskRepetitonSummary) => ids.add(task.id));

    const updatedTasks = await fetchUpdatedRepetitiveTasks(db, Array.from(ids.values()));
    if(updatedTasks === null) {
        return null;
    }
    return tasks.map((task: TaskRepetitonSummary) => {
        const updatedTask = updatedTasks.find((val: TaskDateTime) => val.id === task.id && val.date.getTime() === task.date.getTime());
        if(updatedTask === undefined) {
            return task;
        }
        return {...task, start_time: updatedTask.startTime, end_time: updatedTask.endTime};
    });
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
