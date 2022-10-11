import { DBClient } from "../../db-client/client";

export async function deleteCategory(db: DBClient, id?: number, name?: string): Promise<boolean> {
    if(id === undefined && name === undefined) {
        return false;
    }

    const queryWithId = {
        name: "delete-task-category-by-id-query",
        text: "DELETE FROM task_category WHERE id=$1",
        values: [id]
    };

    const queryWithName = {
        name: "delete-task-category-by-name-query",
        text: "DELETE FROM task_category WHERE name=$1",
        values: [name]
    };

    const client = await db.connect();
    try {
        const res = (id !== undefined)
            ? await client.query(queryWithId)
            : await client.query(queryWithName);
        return res.rowCount === 1;
    } catch(err: any) {
        console.error(err.stack);
    } finally {
        client.release();
    }
    return false;
}

