import { DBClient } from "../../db-client/client"; 
import { ToDo, parseToDo } from "./types";

export async function fetchTodos(db: DBClient, id?: number[]): Promise<ToDo[] | null> {
    const prepareQuery = () => {
        const baseQuery = `
            SELECT id, group_id, content, priority, task_id as done_task_id
            FROM todo_tasks t
            LEFT JOIN done_tasks dt
                ON dt.task_id = t.id`;
        if(id === undefined) return baseQuery;

        return `${baseQuery}
            WHERE
            ${(id !== undefined) ? `t.id = ANY ($1)` : ""}
        `;
    };

    console.log(prepareQuery());

    const fetchTodosQuery = {
        name: `fetch-todos${(id === undefined) ? "-all" : ""}`,
        text: prepareQuery(),
        values: (id === undefined) ? [] : [id]
    };

    const client = await db.connect();
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

