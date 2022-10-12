import { DBClient } from "../../db-client/client";
import { RepetitiveTask, parseRepetitiveTask } from "./types";
import { RepetitionType, TaskTime, localDateToUTC, taskDateToDate } from "../../data-types/task";
import fetchExcludedRepetitiveTasks, { TaskDate } from "./fetch-excluded-tasks";
import fetchUpdatedRepetitiveTasks, { TaskDateTime } from "./fetch-updated-tasks";

export interface TaskRepetitonSummary {
    id: number;
    date: Date;
    end_date: Date | null;
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
                    expandRepetitiveTasks(res.rows
                        .map((val: any) => parseRepetitiveTask(val))
                        .filter((val: RepetitiveTask | undefined) => val !== undefined)
                        .map((val: RepetitiveTask | undefined) => val!)
                    )
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
    const validEndDate = (event_end !== null && event_end < end_date) ? event_end : end_date;
    const diffBeforeEndDate = validEndDate - event_begin;
    const endIt = parseInt((diffBeforeEndDate / diff).toFixed());
    return ((event_begin + endIt * diff) > validEndDate) ? endIt - 1 : endIt;
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
            return date.getUTCFullYear() * 12 + date.getUTCMonth();
        case "yearly":
            return date.getUTCFullYear();
        case "day-of-week":
            return date.getTime();
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
        case "day-of-week":
            return msInDay * 7;
    }
}

// function getUTCDate(year: number, month: number, day: number): Date {
//     const date = new Date();
//     date.setUTCFullYear(year);
//     date.setUTCMonth(month, day);
//     date.setUTCHours(0);
//     date.setUTCMinutes(0);
//     date.setUTCSeconds(0);
//     date.setUTCMilliseconds(0);
//     return date;
// }

function parseNumericDateToBuiltin(task: RepetitiveTask, numeric: number): Date {
    switch(task.type) {
        case "daily":
        case "weekly":
        case "day-of-week":
            return new Date(numeric);
        case "monthly":
            const year = parseInt((numeric / 12).toFixed());
            const month = numeric - (year * 12);
            return taskDateToDate({year: year, month: month + 1, day: task.start_date.getUTCDate()});
        case "yearly":
            return taskDateToDate({year: numeric, month: task.start_date.getUTCMonth() + 1, day: task.start_date.getUTCDate()});
    }
}

export function expandRepetitiveTasks(tasks: RepetitiveTask[]): RepetitiveTask[] {
    return tasks.filter((task: RepetitiveTask) => task.type !== "day-of-week")
        .concat(...tasks
            .filter((task: RepetitiveTask) => task.type === "day-of-week")
            .map((task: RepetitiveTask) => expandDayOfTheWeekRepetitiveTask(task))
        );
}

function getDayOfTheWeek(date: Date): number {
    const day = date.getDay();
    return (day === 0) ? 6 : day - 1;
}

export function expandDayOfTheWeekRepetitiveTask(task: RepetitiveTask): RepetitiveTask[] {
    if(task.type !== "day-of-week") {
        return [];
    }
    const week = new Array(7) as Date[];
    const startDay = getDayOfTheWeek(task.start_date);
    const startDate = task.start_date;
    week[startDay] = startDate;
    const msInDay = 1000 * 60 * 60 * 24;


    for(let i = 0; i < startDay; i++) {
        week[i] = new Date(startDate.getTime() + (7 - startDay + i) * msInDay);
    }
    for(let i = 0; i < 6 - startDay; i++) {
        week[startDay + i + 1] = new Date(startDate.getTime() + (i + 1) * msInDay);
    }

    const days = [] as boolean[];
    let count = task.count;
    for(let i = 0; i < 7; i++) {
        days.push(count % 2 === 1);
        count = count >> 1;
    }

    return days.map((val: boolean, index: number) => val ? index : -1)
        .filter((id: number) => id >= 0)
        .map((id: number) => {
            return {...task, start_date: week[id]};
        });
}

export function calcRepetitiveTasksDatesForDateRange(start_date: Date, end_date: Date, tasks: RepetitiveTask[]): TaskRepetitonSummary[] {
    const result = [] as TaskRepetitonSummary[];
    tasks.forEach((val: RepetitiveTask) => {
        const startDate = getDateNumericRepresentation(start_date, val.type);
        const endDate = getDateNumericRepresentation(end_date, val.type);
        const eventBegin = getDateNumericRepresentation(val.start_date, val.type);
        const eventEnd = (val.end_date === null) ? null : getDateNumericRepresentation(val.end_date, val.type);
        const count = (val.type === "day-of-week") ? 1 : val.count;

        calcOccurences(startDate, endDate, eventBegin, eventEnd, count * getRepetitionTypeDiff(val.type)).forEach((numericDate: number) => {
            result.push({id: val.id, date: parseNumericDateToBuiltin(val, numericDate), type: val.type, count: val.count, end_date: val.end_date});
        });
    });
    return result;
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

