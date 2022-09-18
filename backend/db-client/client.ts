import { Client, QueryConfig, QueryArrayConfig, QueryResult } from 'pg';
import { Task, parseTask, taskTimeToString, taskDateToDate, mapCategory } from '../data-types/task';
import { Config, parseConfig } from '../data-types/config';
import { setTimeout } from 'timers/promises';

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

    async fetchTasks(params: FetchParams): Promise<Task[] | null> {
        if(params.year !== undefined && params.month !== undefined) {
            return await this.fetchTasksWithQuery(this.singleMonthQuery(params.month, params.year));
        }
        if(params.year !== undefined) {
            return await this.fetchTasksWithQuery(this.singleYearQuery(params.year));
        }
        if(params.id !== undefined) {
            return await this.fetchTasksWithQuery(this.idQuery(params.id));
        }
        return null;
    }

    async fetchTasksWithQuery(query: QueryConfig): Promise<Task[] | null> {
        try {
            const result = await this.client.query(query);
            return result.rows
                .map((val: any)=>parseTask(val))
                .filter((val: Task | undefined) => val !== undefined)
                .map((val: Task | undefined) => val!);
        } catch(err: any) {
            console.error(err.stack);
            return null;
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

    async insertTask(task: Task): Promise<number | null> {
        const query = {
            name: "insert-task",
            text: `INSERT INTO tasks 
            (start_time, end_time, date, basic_info, description, category) 
            VALUES 
            ($1,         $2,       $3,   $4,         $5,          $6)
            RETURNING id`,
            values: [
                taskTimeToString(task.start_time),
                taskTimeToString(task.end_time),
                taskDateToDate(task.date),
                task.basic_info,
                task.description,
                mapCategory(task.category)
            ],
        };

        try {
            const result = await this.client.query(query);
            if(result.rows.length != 1) {
                return null;
            }
            const id = result.rows[0]["id"] as number;
            if(id === null || id === undefined) {
                return null;
            }
            return id;
        } catch(err: any) {
            console.log(err.stack);
            return null;
        }
    }

    async updateTask(task: Task): Promise<boolean> {
        const query = {
            name: "update-task",
            text: `UPDATE tasks
                   SET start_time=$1,
                       end_time=$2,
                       date=$3,
                       basic_info=$4,
                       description=$5,
                       category=$6
                   WHERE id=$7`,
            values: [
                taskTimeToString(task.start_time),
                taskTimeToString(task.end_time),
                taskDateToDate(task.date),
                task.basic_info,
                task.description,
                mapCategory(task.category),
                task.id
            ],
        };

        try {
            const res = await this.client.query(query);
            return res.rowCount > 0;
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
            const res = await this.client.query(query);
            return res.rowCount > 0;
        } catch(err: any) {
            console.error(err.stack);
            return false;
        }
    }

    async fetchConfig(): Promise<Config | null> {
        const query = {
            name: "fetch-config",
            text: "SELECT * FROM config",
        };

        try {
            const result = await this.client.query(query);
            return parseConfig(result.rows);
        } catch(err: any) {
            console.error(err.stack);
            return null;
        }
    }

    async updateConfig(name: string, val: string | number): Promise<boolean> {
        const updateQueryInt = {
            name: "update-config-val_i",
            text: "UPDATE config SET val_i=$1 WHERE name=$2",
            values: [val, name],
        };
        const updateQueryStr = {
            name: "update-config-val_i",
            text: "UPDATE config SET val_s=$1 WHERE name=$2",
            values: [val, name],
        };

        try {
            const res = (typeof val === "string") ? await this.client.query(updateQueryStr) : await this.client.query(updateQueryInt);
            return res.rowCount > 0;
        } catch(err: any) {
            console.error(err.stack);
        }

        const insertQueryInt = {
            name: "insert-config-val_i",
            text: "INSERT INTO config (name, val_i) VALUES ($1, $2)",
            values: [name, val],
        };
        const insertQueryStr = {
            name: "insert-config-val_s",
            text: "INSERT INTO config (name, val_s) VALUES ($1, $2)",
            values: [name, val],
        };

        try {
            const res = (typeof val === "string") ? await this.client.query(insertQueryStr) : await this.client.query(insertQueryInt);
            return res.rowCount > 0;
        } catch(err: any) {
            console.error(err.stack);
        }

        return false;
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

