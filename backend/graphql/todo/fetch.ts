import { DBClient } from "../../db-client/client";
import { ToDo, parseToDo } from "./types";

export async function fetchTodos(db: DBClient, id?: number[], priority?: number): Promise<ToDo[] | null> {
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

