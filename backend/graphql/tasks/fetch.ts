import { DBClient } from "../../db-client/client";
import { Task, parseTask, RepetitionType, taskDateFromDate, optionalTaskDateFromDate } from "../../data-types/task";
import { fetchRepetitiveTasks, TaskRepetitonSummary } from "../repetitive-tasks/fetch";
import { QueryConfig } from "pg";
import {RepetitiveTask} from "../repetitive-tasks/types";

async function fetchTasksWithQuery(db: DBClient, query: QueryConfig): Promise<Task[] | null> {
    const client = await db.connect();
    try {
        const result = await client.query(query);
        return result.rows
            .map((val: any)=>parseTask(val))
            .filter((val: Task | undefined) => val !== undefined)
            .map((val: Task | undefined) => val!);
    } catch(err: any) {
        console.error(err.stack);
    } finally {
        client.release();
    }
    return null;
}

function singleMonthQuery(month: number, year: number): QueryConfig {
    const lower = `${year}-${month}-01`;
    const upper = `${(month === 12) ? year + 1 : year}-${(month === 12) ? 1 : month + 1}-01`;
    return {
        name: "select-tasks-by-month",
        text: `
            SELECT t.id, t.date, t.start_time, t.end_time, t.basic_info, t.description, c.name AS category
            FROM tasks t
            LEFT JOIN task_category c
                ON c.id = t.category
            WHERE date >= $1 AND date < $2
        `,
        values: [lower, upper],
    };
}

function singleYearQuery(year: number): QueryConfig {
    const lower = `${year}-01-01`;
    const upper = `${year + 1}-01-01`;
    return {
        name: "select-tasks-by-year",
        text: `
            SELECT t.id, t.date, t.start_time, t.end_time, t.basic_info, t.description, c.name AS category
            FROM tasks t
            LEFT JOIN task_category c
                ON c.id = t.category
            WHERE date >= $1 AND date < $2
        `,
        values: [lower, upper]
    };
}

function idQuery(id: number[]): QueryConfig {
    return {
        name: "select-task-by-id",
        text: `
            SELECT t.id, t.date, t.start_time, t.end_time, t.basic_info, t.description, c.name AS category
            FROM tasks t
            LEFT JOIN task_category c
                ON c.id = t.category
            WHERE t.id = ANY ($1)
        `,
        values: [id]
    };
}

export async function fetchTasks(db: DBClient, year?: number, month?: number, id?: number[]): Promise<Task[] | null> {
    if(year !== undefined) {
        return await fetchTasksInDateRange(db, year, month);
    }
    if(id !== undefined) {
        return await fetchTasksWithQuery(db, idQuery(id));
    }
    return null;
}

function getStartDate(year: number, month?: number): Date {
    const date = new Date();
    date.setUTCFullYear(year);
    date.setUTCMonth((month) ? month - 1 : 0);
    date.setUTCDate(1);
    date.setUTCHours(0);
    date.setUTCMinutes(0);
    date.setUTCSeconds(0);
    date.setUTCMilliseconds(0);
    return date;
}

function getEndDate(year: number, month?: number): Date {
    const msInDay = 1000 * 60 * 60 * 24;
    const date = new Date();
    date.setUTCFullYear((month) ? year : year + 1);
    date.setUTCMonth((month) ? month : 0);
    date.setUTCDate(1);
    date.setUTCHours(0);
    date.setUTCMinutes(0);
    date.setUTCSeconds(0);
    date.setUTCMilliseconds(0);
    return new Date(date.getTime() - msInDay);
}

function updateTask(task: Task, repetitionTask: TaskRepetitonSummary): Task {
    if(repetitionTask.start_time === undefined || repetitionTask.end_time === undefined) {
        return {...task, date: taskDateFromDate(repetitionTask.date), description: (repetitionTask.description !== undefined) ? repetitionTask.description : task.description, repetition: {type: repetitionTask.type, count: repetitionTask.count, end_date: optionalTaskDateFromDate(repetitionTask.end_date)}};
    }
    return {...task, date: taskDateFromDate(repetitionTask.date), description: (repetitionTask.description !== undefined) ? repetitionTask.description : task.description, start_time: repetitionTask.start_time, end_time: repetitionTask.end_time, repetition: {type: repetitionTask.type, count: repetitionTask.count, end_date: optionalTaskDateFromDate(repetitionTask.end_date)}};
}

async function fetchTasksInDateRange(db: DBClient, year: number, month?: number): Promise<Task[] | null> {
    const tasksQuery = (month) ? singleMonthQuery(month, year) : singleYearQuery(year);
    const tasksPromise = fetchTasksWithQuery(db, tasksQuery);
    const repetitiveTasksPromise = fetchRepetitiveTasks(db, getStartDate(year, month), getEndDate(year, month));

    const tasks = await tasksPromise;
    const repetitiveTasks = await repetitiveTasksPromise;

    if(tasks === null || repetitiveTasks === null) {
        return null;
    }

    const result = [] as Task[];
    const taskIdsToFetch = new Set() as Set<number>;
    repetitiveTasks.forEach((repetitionTask: TaskRepetitonSummary) => {
        const task = tasks.find((val: Task) => val.id === repetitionTask.id);
        if(task === undefined) {
            taskIdsToFetch.add(repetitionTask.id);
            return;
        }
        result.push(updateTask(task, repetitionTask));
    });

    result.push(...tasks.filter((task: Task) => repetitiveTasks.find((repTask: TaskRepetitonSummary) => repTask.id === task.id) === undefined));

    const additionalTasks = await fetchTasks(db, undefined, undefined, Array.from(taskIdsToFetch.values()));
    if(additionalTasks === null) {
        return null;
    }

    repetitiveTasks
        .filter((repTask: TaskRepetitonSummary) => result.find((task: Task) => task.id === repTask.id) === undefined)
        .forEach((repTask: TaskRepetitonSummary) => {
            const task = additionalTasks.find((t: Task) => t.id === repTask.id);
            if(task === undefined) {
                return;
            }
            result.push(updateTask(task, repTask));
        });

    return result;
}

