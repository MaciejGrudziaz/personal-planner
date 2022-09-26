import { DBClient } from '../../db-client/client';

export async function createTodo(db: DBClient, group_id: number, content?: string, priority?: number): Promise<number | null> {
    const insertToDoQuery = {
        name: "insert-todo",
        text: `
            INSERT INTO todo_tasks (group_id, content, priority)
            VALUES ($1, $2, $3)
            RETURNING id
        `,
        values: [group_id, content, (priority) ? priority : 0]
    };

    const client = await db.connect();
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


