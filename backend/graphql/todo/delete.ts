import { DBClient } from "../../db-client/client";

export async function deleteTodos(db: DBClient, id: number[]): Promise<boolean> {
    const deleteTodoQuery = {
        name: "delete-todo-query",
        text: "DELETE FROM todo_tasks WHERE id = ANY($1)",
        values: [id]
    };

    const client = await db.connect();
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

