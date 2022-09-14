import { Client, QueryConfig, QueryArrayConfig, QueryResult } from 'pg';
import { setTimeout } from 'timers/promises';

export interface TaskTime {
    hour: number;
    minute: number;
}

function numToFixedString(val: number): string {
    return (val < 10) ? "0" + val.toFixed() : val.toFixed();
}

export function taskTimeToString(time: TaskTime | null): string | null{
    if(time === null) {
        return null;
    }
    return `${numToFixedString(time.hour)}:${numToFixedString(time.minute)}:00`;
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

export interface TaskDate {
    year: number;
    month: number;
    day: number;
}

function taskDateFromDate(date: Date): TaskDate {
    return {year: date.getFullYear(), month: date.getMonth(), day: date.getDate()};
}

function taskDateToDate(date: TaskDate): Date {
    return new Date(date.year, date.month - 1, date.day);
}

export function taskDateToString(date: TaskDate): string {
    return `${date.year}-${numToFixedString(date.month)}-${numToFixedString(date.day)}`;
}

export interface Task {
    id: number;
    startTime: TaskTime | null;
    endTime: TaskTime | null;
    date: TaskDate;
    basicInfo: string;
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

function mapCategory(category: Category): number {
    switch(category) {
        case "simple":
            return 0;
        case "important":
            return 1;
    }
}

function exists(val: any): boolean {
    return val !== null && val !== undefined;
}

function parseTask(value: any): Task | undefined {
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
        startTime: (exists(value["start_time"])) ? taskTimeFromString(value["start_time"]) : null,
        endTime: (exists(value["end_time"])) ? taskTimeFromString(value["end_time"]) : null,
        date: taskDateFromDate(date),
        basicInfo: (exists(value["basic_info"])) ? value["basic_info"] : "",
        description: (exists(value["description"])) ? value["description"] : "",
        category: category,
    };
}

export interface FetchParams {
    year?: number;
    month?: number;
    id?: number[];
}

export interface ConnectionParams {
    user: string;
    password: string;
    database: string;
    host?: string;
    port?: number;
}

export class DBClient {
    params: ConnectionParams;
    client: Client;

    constructor(params: ConnectionParams) {
        this.params = params;
        this.client = new Client({
            user: this.params.user, 
            password: this.params.password, 
            database: this.params.database, 
            host: (this.params.host !== undefined) ? this.params.host : "localhost", 
            port: (this.params.port !== undefined) ? this.params.port : 5432
        });
    }
    async connect(): Promise<void> {
        await this.client.connect();
    }

    async fetchTasks(params: FetchParams): Promise<Task[] | undefined> {
        if(params.year !== undefined && params.month !== undefined) {
            return await this.fetchTasksWithQuery(this.singleMonthQuery(params.month, params.year));
        }
        if(params.year !== undefined) {
            return await this.fetchTasksWithQuery(this.singleYearQuery(params.year));
        }
        if(params.id !== undefined) {
            return await this.fetchTasksWithQuery(this.idQuery(params.id));
        }
        return undefined;
    }

    async fetchTasksWithQuery(query: QueryConfig): Promise<Task[] | undefined> {
        try {
            const result = await this.client.query(query);
            return result.rows
                .map((val: any)=>parseTask(val))
                .filter((val: Task | undefined) => val !== undefined)
                .map((val: Task | undefined) => val!);
        } catch(err: any) {
            console.error(err.stack);
            return undefined;
        }
    }

    singleMonthQuery(month: number, year: number): QueryConfig {
        const lower = `${year}-${month}-01`;
        const upper = `${(month === 12) ? year + 1 : year}-${(month === 12) ? 1 : month + 1}-01`;
        return {
            name: "select-tasks-by-month",
            text: "SELECT * FROM tasks WHERE date >= $1 AND date < $2",
            values: [lower, upper],
        };
    }

    singleYearQuery(year: number): QueryConfig {
        const lower = `${year}-01-01`;
        const upper = `${year + 1}-01-01`;
        return {
            name: "select-tasks-by-year",
            text: "SELECT * FROM tasks WHERE date >= $1 AND date < $2",
            values: [lower, upper]
        };
    }

    idQuery(id: number[]): QueryConfig {
        return {
            name: "select-task-by-id",
            text: "SELECT * FROM tasks WHERE id = ANY ($1)",
            values: [id]
        };
    }

    async insertTask(task: Task): Promise<number | undefined> {
        const query = {
            name: "insert-task",
            text: `INSERT INTO tasks 
            (start_time, end_time, date, basic_info, description, category) 
            VALUES 
            ($1,         $2,       $3,   $4,         $5,          $6)
            RETURNING id`,
            values: [
                taskTimeToString(task.startTime),
                taskTimeToString(task.endTime),
                taskDateToDate(task.date),
                task.basicInfo,
                task.description,
                mapCategory(task.category)
            ],
        };

        try {
            const result = await this.client.query(query);
            if(result.rows.length != 1) {
                return undefined;
            }
            const id = result.rows[0]["id"] as number;
            if(id === null || id === undefined) {
                return undefined;
            }
            return id;
        } catch(err: any) {
            console.log(err.stack);
            return undefined;
        }
    }

    async updateTask(task: Task): Promise<boolean> {
        const query = {
            name: "update-task",
            text: `UDPATE tasks
                   SET start_time=$1,
                       end_time=$2,
                       date=$3,
                       basic_info=$4,
                       description=$5,
                       category=$6
                   WHERE id=$7`,
            values: [
                taskTimeToString(task.startTime),
                taskTimeToString(task.endTime),
                taskDateToDate(task.date),
                task.basicInfo,
                task.description,
                mapCategory(task.category)
            ],
        };

        try {
            await this.client.query(query);
            return true;
        } catch(err: any) {
            console.error(err.stack);
            return false;
        }
    }

    async deleteTask(id: number): Promise<boolean> {
        const query = {
            name: "delete-task",
            text: "DELETE FROM tasks WHERE id=$1",
            values: [id],
        };

        try {
            await this.client.query(query);
            return true;
        } catch(err: any) {
            console.error(err.stack);
            return false;
        }
    }
}

export async function initDBClient(params: ConnectionParams, retryCounter?: number): Promise<DBClient | undefined> {
    if(retryCounter === undefined) {
        retryCounter = 2;
    }

    const client = new DBClient(params);
    try {
        await client.connect();
    } catch(err: any) {
        console.error(`Error connecting to database on ${params.host}\n`, err.stack);
        if(retryCounter > 0) {
            console.log("retrying...");
            await setTimeout(5000);
            return initDBClient(params, retryCounter - 1);
        }
        return undefined;
    }

    console.log(`Connected to database at ${(params.host === undefined) ? "localhost" : params.host}:${(params.port === undefined) ? 5432 : params.port}`);
    return client;
}

