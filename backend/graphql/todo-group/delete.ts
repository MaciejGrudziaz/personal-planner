import { DBClient } from '../../db-client/client';

export async function deleteTodoGroups(db: DBClient, id: number[]): Promise<boolean> {
    const deleteGroupQuery = {
        name: "delete-todo-group",
        text: "DELETE FROM todo_groups WHERE id = ANY ($1)",
        values: [id]
    };

    const client = await db.connect();
    try {
        const res = await client.query(deleteGroupQuery);
        return res.rowCount === id.length;
    } catch(err: any) {
    } finally {
        client.release();
    }
    return false;
}

