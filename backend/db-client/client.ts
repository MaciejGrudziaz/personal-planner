import { Pool, Client, QueryConfig, QueryArrayConfig, QueryResult, PoolClient } from 'pg';
import { Task, parseTask, taskTimeToString, taskDateToDate, mapCategory } from '../data-types/task';
import { Config, parseConfig } from '../data-types/config';
import { ToDo, ToDoGroup, parseToDo, parseToDoGroup } from '../data-types/todo';
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
        //await this.client.connect();
        return this.pool.connect();
    }

    async fetchTasks(year?: number, month?: number, id?: number[]): Promise<Task[] | null> {
        if(year !== undefined && month !== undefined) {
            return await this.fetchTasksWithQuery(this.singleMonthQuery(month, year));
        }
        if(year !== undefined) {
            return await this.fetchTasksWithQuery(this.singleYearQuery(year));
        }
        if(id !== undefined) {
            return await this.fetchTasksWithQuery(this.idQuery(id));
        }
        return null;
    }

    async fetchTasksWithQuery(query: QueryConfig): Promise<Task[] | null> {
        const client = await this.connect();
        try {
            const result = await client.query(query);
            return result.rows
                .map((val: any)=>parseTask(val))
                .filter((val: Task | undefined) => val !== undefined)
                .map((val: Task | undefined) => val!);
        } catch(err: any) {
            console.error(err.stack);
            return null;
        } finally {
            client.release();
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

    async fetchTodoGroups(id?: number[]): Promise<ToDoGroup[] | null> {
        const fetchTodoGroupQuery = {
            name: "fetch-todo-groups",
            text: `
                SELECT g.id as group_id, g.name as group_name, g.ordinal group_ordinal, t.id as id, t.content as content, t.priority as priority, dt.task_id as done_task_id
                FROM todo_groups g
                INNER JOIN todo_tasks t
                    ON t.group_id = g.id
                LEFT JOIN done_tasks dt
                    ON dt.task_id = t.id
                ${(id !== undefined) ? `WHERE g.id = ANY ($1)` : ""}`,
            values: (id === undefined) ? [] : [id]
        };

        const client = await this.connect();
        try {
            const res = await client.query(fetchTodoGroupQuery);
            return parseToDoGroup(res.rows);
        } catch(err: any) {
            console.error(err.stack);
        } finally {
            client.release();
        }

        return null;
    }

    async insertTodoGroup(name?: string, ordinal?: number): Promise<number | null> {
        const insertTodoGroup = {
            name: "insert-todo-group",
            text: "INSERT INTO todo_groups (name, ordinal) VALUES ($1, $2) RETURNING id",
            values: [name, (ordinal) ? ordinal : 0]
        };

        const client = await this.connect();
        try {
            const res = await client.query(insertTodoGroup);
            if(res.rows.length === 0) {
                return null;
            }
            const id = res.rows[0]["id"] as number;
            if(id === undefined || id === null) {
                return null;
            }
            return id;
        } catch(err: any) {
            console.error(err.stack);
        } finally {
            client.release();
        }

        return null;
    }

    async updateTodoGroup(id: number, name?: string, ordinal?: number): Promise<boolean> {
        if(!name && !ordinal) {
            return false;
        }

        const prepareQuery = () => {
            let argCounter = 1;
            return `
                UPDATE todo_groups
                SET
                    ${(name !== undefined) ? `name = $${++argCounter}` : ""}
                    ${(ordinal !== undefined) ? `ordinal = $${++argCounter}` : ""}
                WHERE id = $1
            `;
        }

        const updateTodoGroup = {
            name: "update-todo-group",
            text: prepareQuery(),
            values: [id, name, ordinal].filter((val: any) => val !== undefined)
        };

        const client = await this.connect();
        try {
            const res = await client.query(updateTodoGroup);
            return res.rowCount === 1;
        } catch(err: any) {
            console.error(err.stack);
        } finally {
            client.release();
        }
        return false;
    }

    async deleteTodoGroups(id: number[]): Promise<boolean> {
        const deleteGroupQuery = {
            name: "delete-todo-group",
            text: "DELETE FROM todo_groups WHERE id = ANY ($1)",
            values: [id]
        };

        const client = await this.connect();
        try {
            const res = await client.query(deleteGroupQuery);
            return res.rowCount === id.length;
        } catch(err: any) {
        } finally {
            client.release();
        }
        return false;
    }

    async fetchTodos(id?: number[], priority?: number): Promise<ToDo[] | null> {
        const prepareQuery = () => {
            const baseQuery = `
                SELECT id, group_id, content, priority, task_id as done_task_id
                FROM todo_tasks t
                LEFT JOIN done_tasks dt
                    ON dt.task_id = t.id`;
            if(id === undefined && priority === undefined) return baseQuery;

            let argCounter = 0;
            return `${baseQuery}
                WHERE
                ${(id !== undefined) ? `t.id = ANY ($${++argCounter})` : ""}
                ${(priority !== undefined) ? `t.priority = $${++argCounter}` : ""}
            `;
        };

        console.log(prepareQuery());

        const fetchTodosQuery = {
            name: "fetch-todos",
            text: prepareQuery(),
            values: [id, priority].filter((val: any) => val !== undefined)
        };

        const client = await this.connect();
        try {
            const result = await client.query(fetchTodosQuery);
            return result.rows
                .map((val: any)=>parseToDo(val))
                .filter((val: ToDo | undefined) => val !== undefined)
                .map((val: ToDo | undefined) => val!);

        } catch(err: any) {
            console.error(err.stack);
        } finally {
            client.release();
        }

        return null;
    }

    async insertTodo(group_id: number, content?: string, priority?: number): Promise<number | null> {
        const insertToDoQuery = {
            name: "insert-todo",
            text: `
                INSERT INTO todo_tasks (group_id, content, priority)
                VALUES ($1, $2, $3)
                RETURNING id
            `,
            values: [group_id, content, (priority) ? priority : 0]
        };

        const client = await this.connect();
        try {
            const result = await client.query(insertToDoQuery);
            if(result.rows.length === 0) {
                return null;
            }
            const id = result.rows[0]["id"] as number;
            if(id === undefined || id === null) {
                return null;
            }
            return id;
        } catch(err: any) {
            console.error(err.stack);
        } finally {
            client.release();
        }
        return null;
    }

    async updateTodo(id: number, content?: string, priority?: number, groupId?: number, done?: boolean): Promise<boolean> {
        const prepareUpdateQuery = () => {
            let argCounter = 1;
            return `
            UPDATE todo_tasks
            SET
                ${(content !== undefined) ? `content = $${++argCounter}` : ""}
                ${(priority !== undefined) ? `priority = $${++argCounter}` : ""}
                ${(groupId !== undefined) ? `group_id = $${++argCounter}` : ""}
            WHERE id = $1
            `
        };

        const insertDoneTasksQuery = "INSERT INTO done_tasks (task_id) VALUES ($1)";
        const deleteDoneTasksQuery = "DELETE FROM done_tasks WHERE task_id = $1";
        const fetchDoneTasksQuery = "SELECT task_id FROM done_tasks WHERE task_id = $1";

        const updateDoneTasks = async () => {
            if(done === undefined) {
                return;
            }
            const fetchRes = await client.query({name: "fetch-done-tasks", text: fetchDoneTasksQuery, values: [id]});
            if(fetchRes.rowCount === 0 && done === false) {
                return;
            }
            if(fetchRes.rowCount === 1 && done === true) {
                return;
            }

            const updateRes = (done === true)
                ? await client.query({name: "insert-done-tasks", text: insertDoneTasksQuery, values: [id]})
                : await client.query({name: "delete-done-tasks", text: deleteDoneTasksQuery, values: [id]});

            if(updateRes.rowCount !== 1) {
                throw `error: update of done_tasks for '${id}' failed`;
            }
        }

        const updateToDoQuery = {
            name: "update-todo-query",
            text: prepareUpdateQuery(),
            values: [id, content, priority, groupId].filter((val: any) => val !== undefined)
        };

        const client = await this.connect();
        try {
            await client.query("BEGIN");
            updateDoneTasks();
            if(groupId !== undefined || content !== undefined || priority !== undefined) {
                const res = await client.query(updateToDoQuery);
                if(res.rowCount !== 1) {
                    throw `error: updateTodo: update of todo_tasks for '${id}' failed`;
                }
            }
            await client.query("COMMIT");
            return true;
        } catch(e: any) {
            console.error(e.stack);
            await client.query("ROLLBACK");
        } finally {
            client.release();
        }
        return false;
    }

    async deleteTodo(id: number[]): Promise<boolean> {
        const deleteTodoQuery = {
            name: "delete-todo-query",
            text: "DELETE FROM todo_tasks WHERE id = ANY($1)",
            values: [id]
        };

        const client = await this.connect();
        try {
            const res = await client.query(deleteTodoQuery);
            return res.rowCount === id.length;
        } catch(e: any) {
            console.error(e.stack);
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

