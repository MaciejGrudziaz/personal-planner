import { Pool, Client, QueryConfig, QueryArrayConfig, QueryResult, PoolClient } from 'pg';
import { Task, parseTask, taskTimeToString, taskDateToDate, optionalTaskDateToDate, TaskRepetition, mapRepetitionType, TaskTime, TaskDate } from '../data-types/task';
import { fetchCategoryByName } from "../graphql/task-category/fetch";
import { Config, parseConfig } from '../data-types/config';
import { setTimeout } from 'timers/promises';
import { TaskDate as ExcludedTaskDate } from '../graphql/repetitive-tasks/excluded-tasks';

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

    getInsertTaskQuery(task: Task, categoryId: number): QueryConfig<any> {
        return {
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
                categoryId
            ],
        };
    }

    async insertTask(task: Task): Promise<number | null> {
        if(task.category === null) {
            return null;
        }

        const client = await this.connect();
        await client.query("BEGIN");
        try {
            const category = await fetchCategoryByName(client, [task.category]);
            if(category === null || category.length !== 1) {
                await client.query("ROLLBACK");
                return null;
            }

            const result = await client.query(this.getInsertTaskQuery(task, category[0].id));
            if(result.rows.length != 1) {
                return null;
            }
            const id = result.rows[0]["id"] as number;
            if(id === null || id === undefined) {
                return null;
            }

            if(task.repetition !== null) {
                const res = await this.insertTaskRepetition(client, id, task.repetition);
                if(!res) {
                    await client.query("ROLLBACK");
                    return null;
                }
            }
            await client.query("COMMIT");
            return id;
        } catch(err: any) {
            console.log(err.stack);
        } finally {
            client.release();
        }
        await client.query("ROLLBACK");
        return null;
    }

    async insertTaskRepetition(client: PoolClient, id: number, taskRepetition: TaskRepetition): Promise<boolean> {
        const query = {
            name: "insert-task-repetition-query",
            text: `
                INSERT INTO repetitive_tasks
                (id, type, count, end_date)
                VALUES
                ($1, $2,   $3,    $4)
            `,
            values: [
                id, 
                mapRepetitionType(taskRepetition.type), 
                taskRepetition.count,
                optionalTaskDateToDate(taskRepetition.end_date)
            ]
        };

        try {
            const result = await client.query(query);
            return result.rowCount === 1;
        } catch(err: any) {
            console.error(err.stack);
        }
        return false;
    }

    async checkIfTaskRepetitionExist(client: PoolClient, id: number): Promise<boolean> {
        const query = {
            name: "select-task-repetition-query",
            text: "SELECT id FROM repetitive_tasks WHERE id = $1",
            values: [id]
        };

        try {
            const result = await client.query(query);
            return result.rowCount === 1;
        } catch(err: any) {
            console.error(err.stack);
        }
        return false;
    }

    async checkIfRepetitiveTaskWasUpdated(client: PoolClient, id: number, date: Date): Promise<boolean> {
        const query = {
            name: "select-changed-repetitive-tasks-query",
            text: "SELECT id FROM changed_repetitive_tasks WHERE id=$1 AND date=$2",
            values: [id, date]
        };

        try {
            const result = await client.query(query);
            return result.rowCount === 1;
        } catch(err: any) {
            console.error(err.stack);
        }
        return false;
    }

    async removeRepetitiveTaskUpdate(client: PoolClient, id: number, date: Date): Promise<boolean> {
        const query = {
            name: "update-changed-repetitive-tasks-query",
            text: "DELETE FROM changed_repetitive_tasks WHERE id=$1 AND date=$2",
            values: [id, date]
        };

        try {
            const result = await client.query(query);
            return result.rowCount === 1;
        } catch(err: any) {
            console.error(err.stack);
        }
        return false;
    }

    async deleteTaskRepetition(client: PoolClient, id: number): Promise<boolean> {
        const query = {
            name: "delete-task-repetition-query",
            text: "DELETE FROM repetitive_tasks WHERE id = $1",
            values: [id]
        };

        try {
            const result = await client.query(query);
            return result.rowCount === 1;
        } catch(err: any) {
            console.error(err.stack);
        }
        return false;
    }

    async updateTaskRepetitionType(client: PoolClient, id: number, taskRepetition: TaskRepetition): Promise<boolean> {
        const updateTaskRepetitionTypeQuery = {
            name: "update-task-repetition-type-query",
            text: `
                UPDATE repetitive_tasks
                SET type     = $2,
                    count    = $3,
                    end_date = $4
                WHERE id = $1
            `,
            values: [
                id,
                mapRepetitionType(taskRepetition.type),
                taskRepetition.count,
                optionalTaskDateToDate(taskRepetition.end_date)
            ]
        };

        try {
            const result = await client.query(updateTaskRepetitionTypeQuery);
            if(result.rowCount === 1) {
                return true;
            }
            return this.insertTaskRepetition(client, id, taskRepetition);
        } catch(err: any) {
            console.error(err.stack);
        }
        return false;
    }

    async updateSingleRepetitiveTask(id: number, date: TaskDate, description: string | null, startTime: TaskTime | null, endTime: TaskTime | null): Promise<boolean> {
        const updateSingleRepetitiveTaskTimeQuery = {
            name: "update-single-repetitive-task-time-query",
            text: `
                UPDATE changed_repetitive_tasks
                SET start_time = $3,
                    end_time = $4,
                    description = $5
                WHERE id = $1 AND date = $2
            `,
            values: [
                id,
                taskDateToDate(date),
                (startTime === null || endTime === null) ? null : taskTimeToString(startTime),
                (startTime === null || endTime === null) ? null : taskTimeToString(endTime),
                description
            ]
        };

        const client = await this.connect();
        try {
            const result = await client.query(updateSingleRepetitiveTaskTimeQuery);
            if(result.rowCount !== 1) {
                return this.insertSingleRepetitiveTask(id, date, description, startTime, endTime);
            }
            return true;
        } catch(err: any) {
            console.error(err.stack);
        } finally {
            client.release();
        }
        return false;
    }

    async insertSingleRepetitiveTask(id: number, date: TaskDate, description: string | null, startTime: TaskTime | null, endTime: TaskTime | null): Promise<boolean> {
        const insertSingleRepetitiveTaskTimeQuery = {
            name: "insert-single-repetitive-task-time-query",
            text: `
                INSERT INTO changed_repetitive_tasks
                (id, date, start_time, end_time, description)
                VALUES
                ($1, $2,   $3,         $4,       $5)
            `,
            values: [
                id,
                taskDateToDate(date),
                (startTime === null || endTime === null) ? null : taskTimeToString(startTime),
                (startTime === null || endTime === null) ? null : taskTimeToString(endTime),
                description
            ]
        };

        const client = await this.connect();
        try {
            const result = await client.query(insertSingleRepetitiveTaskTimeQuery);
            return result.rowCount === 1;
        } catch(err: any) {
            console.error(err.stack);
        } finally {
            client.release();
        }
        return false;
    }

    async deleteSingleRepetitiveTask(id: number, date: TaskDate): Promise<boolean> {
        const insertExcludedRepetitiveTaskQuery = {
            name: "insert-excluded-repetitive-task-query",
            text: `
                INSERT INTO excluded_repetitive_tasks
                (id, date)
                VALUES
                ($1, $2)
            `,
            values: [id, taskDateToDate(date)]
        };

        const client = await this.connect();
        try {
            const result = await client.query(insertExcludedRepetitiveTaskQuery);
            return result.rowCount === 1;
        } catch(err: any) {
            console.error(err.stack);
        } finally {
            client.release();
        }
        return false;
    }

    getUpdateTaskQuery(task: Task, categoryId: number): QueryConfig<any> {
        const query = {
            name: `update-task-${(task.repetition !== null) ? 'without-date' : 'with-date'}`,
            text: `UPDATE tasks
                   SET start_time=$2,
                       end_time=$3,
                       basic_info=$4,
                       description=$5,
                       category=$6
                       ${(task.repetition !== null) ? '' : ',date=$7'}
                   WHERE id=$1`,
            values: [
                task.id,
                taskTimeToString(task.start_time),
                taskTimeToString(task.end_time),
                task.basic_info,
                task.description,
                categoryId,
                taskDateToDate(task.date)
            ],
        };
        if(task.repetition !== null) {
            query.values.pop();
        }
        return query;
    }

    async updateTask(task: Task): Promise<boolean> {
        if(task.category === null) {
            return false;
        }
        const client = await this.connect();
        await client.query("BEGIN");
        try {
            const category = await fetchCategoryByName(client, [task.category]);
            if(category === null || category.length !== 1) {
                await client.query("ROLLBACK");
                return false;
            }

            const res = await client.query(this.getUpdateTaskQuery(task, category[0].id));
            if(res.rowCount !== 1) {
                await client.query("ROLLBACK");
                return false
            }
            const repetitionExists = await this.checkIfTaskRepetitionExist(client, task.id);
            if(task.repetition === null && repetitionExists) {
                const res = await this.deleteTaskRepetition(client, task.id);
                if(!res) {
                    await client.query("ROLLBACK");
                    return false;
                }
            }
            if(task.repetition !== null) {
                const res = await this.updateTaskRepetitionType(client, task.id, task.repetition);
                if(!res) {
                    await client.query("ROLLBACK");
                    return false;
                }
            }
            const wasRepetitionUpdated = await this.checkIfRepetitiveTaskWasUpdated(client, task.id, taskDateToDate(task.date));
            if(wasRepetitionUpdated) {
                const res = await this.removeRepetitiveTaskUpdate(client, task.id, taskDateToDate(task.date));
                if(!res) {
                    await client.query("ROLLBACK");
                    return false;
                }
            }
            await client.query("COMMIT");
            return true;
        } catch(err: any) {
            console.error(err.stack);
        } finally {
            client.release();
        }
        await client.query("ROLLBACK");
        return false;
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

