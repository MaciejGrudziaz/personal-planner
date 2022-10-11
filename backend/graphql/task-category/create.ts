import { DBClient } from "../../db-client/client";

export async function createCategory(db: DBClient, name: string, background_color: string, border_color: string): Promise<number | null> {
    const query = {
        name: "create-task-category-query",
        text: `
            INSERT INTO task_category
            (name, background_color, border_color)
            VALUES
            ($1,   $2,               $3)
            RETURNING id
        `,
        values: [name, background_color, border_color]
    };

    const client = await db.connect();
    try {
        const res = await client.query(query);
        if(res.rowCount !== 1) {
            return null;
        }
        const id = res.rows[0]["id"] as number;
        if(id === null || id === undefined) {
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

