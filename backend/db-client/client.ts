import { Pool, Client, QueryConfig, QueryArrayConfig, QueryResult, PoolClient } from 'pg';
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
    pool: Pool;

    constructor(params: ConnectionParams) {
        this.params = params;
        this.pool = new Pool({
            user: this.params.user, 
            password: this.params.password, 
            database: this.params.database, 
            host: (this.params.host !== undefined) ? this.params.host : "localhost", 
            port: (this.params.port !== undefined) ? this.params.port : 5432
        });
    }

    async connect(): Promise<PoolClient> {
        return this.pool.connect();
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

        const client = await this.connect();
        try {
            const result = await client.query(query);
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
        } finally {
            client.release();
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

        const client = await this.connect();
        try {
            const res = await client.query(query);
            return res.rowCount > 0;
        } catch(err: any) {
            console.error(err.stack);
            return false;
        } finally {
            client.release();
        }
    }

    async deleteTask(id: number): Promise<boolean> {
        const query = {
            name: "delete-task",
            text: "DELETE FROM tasks WHERE id=$1",
            values: [id],
        };

        try {
            const client = await this.connect();
            const res = await client.query(query);
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

        const client = await this.connect();
        try {
            const result = await client.query(query);
            return parseConfig(result.rows);
        } catch(err: any) {
            console.error(err.stack);
            return null;
        } finally {
            client.release();
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
            const client = await this.connect();
            const res = (typeof val === "string") ? await client.query(updateQueryStr) : await client.query(updateQueryInt);
            if(res.rowCount === 1) {
                return true;
            }
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

        const client = await this.connect();
        try {
            const res = (typeof val === "string") ? await client.query(insertQueryStr) : await client.query(insertQueryInt);
            return res.rowCount > 0;
        } catch(err: any) {
            console.error(err.stack);
        } finally {
            client.release();
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

