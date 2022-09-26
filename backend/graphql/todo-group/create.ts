import { DBClient } from '../../db-client/client';

export async function createTodoGroup(db: DBClient, name?: string, ordinal?: number): Promise<number | null> {
    const insertTodoGroup = {
        name: "insert-todo-group",
        text: "INSERT INTO todo_groups (name, ordinal) VALUES ($1, $2) RETURNING id",
        values: [name, (ordinal) ? ordinal : 0]
    };

    const client = await db.connect();
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

