import { DBClient } from "../../db-client/client";
import { QueryResult } from "pg";

export interface TodoPriority {
    id: number;
    priority: number;
}

function parseTodoPriority(val: any): TodoPriority | undefined {
    const id = val["id"];
    const priority = val["priority"];
    if(id === undefined || id === null
       || priority === undefined || priority === null) {
        return undefined;
    }

    return {id: id, priority: priority};
}

type MoveDirection = "up" | "down";

async function fetchAffectedTodos(db: DBClient, id: number, targetId: number): Promise<TodoPriority[] | null> {
    const fetchAffectedTodosQuery = {
        name: "fetch-todos-by-priority",
        text: `
            SELECT t2.id, t2.priority
            FROM todo_tasks t
            LEFT JOIN todo_tasks t2
                ON t2.group_id = t.group_id AND
                   t2.priority >= t.priority AND
                   t2.id != $1
            WHERE t.id = $2
            ORDER BY t2.priority ASC
        `,
        values: [id, targetId]
    };

    const client = await db.connect();
    try {
        const res = await client.query(fetchAffectedTodosQuery);
        return res.rows
            .map((val: any) => parseTodoPriority(val))
            .filter((val: TodoPriority | undefined) => val !== undefined)
            .map((val: TodoPriority | undefined) => val!);
    } catch(err: any) {
        console.error(err.stack);
        client.release();
    } finally {
        client.release();
    }
    return null;
}

export async function updateAffectedTodos(db: DBClient, todos: TodoPriority[]): Promise<boolean> {
    const updateAffectedTodosQuery = `
        UPDATE todo_tasks
        SET priority = $2
        WHERE id = $1
    `;

    const client = await db.connect();
    try {
        const promises = todos.map((val: TodoPriority) => {
            return client.query({name: "update-todos-by-priority", text: updateAffectedTodosQuery, values: [val.id, val.priority]});
        });
        promises.forEach(async (val: Promise<QueryResult<any>>) => await val);
        return true;
    } catch(err: any) {
        console.error(err.stack);
        client.release();
    } finally {
        client.release();
    }
    return false;
}

export async function moveTodo(db: DBClient, id: number, targetId: number): Promise<TodoPriority[] | null> {
    const affectedTodos = await fetchAffectedTodos(db, id, targetId);
    if(affectedTodos === null) {
        return null;
    }
    if(affectedTodos.length === 0) {
        return [];
    }

    const updatePriorities = () => {
        let priority = affectedTodos[0].priority;
        return [{id: id, priority: priority}].concat(affectedTodos).map((val: TodoPriority) => {
            return {...val, priority: priority++};
        });
    };

    const updatedTodos = updatePriorities();

    const res = await updateAffectedTodos(db, updatedTodos);
    if(res === false) {
        return null;
    }

    return updatedTodos;
}

