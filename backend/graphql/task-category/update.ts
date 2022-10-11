import { DBClient } from "../../db-client/client";
import { Category } from "./types";

export async function updateCategory(db: DBClient, category: Category): Promise<boolean> {
    const query = {
        name: "update-task-category-query",
        text: `
            UPDATE task_category
            SET name=$2,
                background_color=$3,
                border_color=$4
            WHERE id=$1
        `,
        values: [category.id, category.name, category.background_color, category.border_color]
    };

    const client = await db.connect();
    try {
        const res = await client.query(query);
        return res.rowCount === 1;
    } catch(err: any) {
        console.error(err.stack);
    } finally {
        client.release();
    }
    return false;
} 

