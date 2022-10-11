import { DBClient } from "../../db-client/client";
import {fetchCategoryByName} from "./fetch";
import { deleteCategory } from "./delete";
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

export async function changeCategory(db: DBClient, src_category: string, dest_category: string): Promise<boolean> {
    const client = await db.connect();
    try {
        const categories = await fetchCategoryByName(client, [src_category, dest_category]);
        if(categories === null) {
            return false;
        }
        const src = categories.find((val: Category) => val.name === src_category);
        const dest = categories.find((val: Category) => val.name === dest_category);
        if(src === undefined || dest === undefined) {
            return false;
        }
        const updateQuery = {
            name: "update-tasks-category-query",
            text: `
                UPDATE tasks
                SET category=$2
                WHERE category=$1
            `,
            values: [src.id, dest.id]
        };
        await client.query(updateQuery);
        return true;
    } catch (err: any) {
        console.error(err.stack);
    } finally {
        client.release();
    }
    return false;
}

