import { DBClient } from '../../db-client/client';
import { ToDoGroup, parseToDoGroup } from './types';

export async function fetchTodoGroups(db: DBClient, id?: number[]): Promise<ToDoGroup[] | null> {
    const fetchTodoGroupQuery = {
        name: `fetch-todo-groups${(id === undefined) ? "-all" : ""}`,
        text: `
            SELECT g.id as group_id, g.name as group_name, g.ordinal group_ordinal, t.id as id, t.content as content, t.priority as priority, dt.task_id as done_task_id
            FROM todo_groups g
            LEFT JOIN todo_tasks t
                ON t.group_id = g.id
            LEFT JOIN done_tasks dt
                ON dt.task_id = t.id
            ${(id !== undefined) ? `WHERE g.id = ANY ($1)` : ""}`,
        values: (id === undefined) ? [] : [id]
    };

    const client = await db.connect();
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

