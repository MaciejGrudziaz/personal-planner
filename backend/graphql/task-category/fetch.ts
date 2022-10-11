import {PoolClient} from "pg";
import { DBClient } from "../../db-client/client";
import { Category, parseCategory } from "./types";

export async function fetchCategories(db: DBClient): Promise<Category[] | null> {
    const query = {
        name: "fetch-task-category-query",
        text: "SELECT id, name, background_color, border_color FROM task_category"
    };

    const client = await db.connect();
    try {
        const res = await client.query(query);
        return res.rows
            .map((val: any) => parseCategory(val))
            .filter((val: Category | undefined) => val !== undefined)
            .map((val: Category | undefined) => val!);
    } catch(err: any) {
        console.error(err.stack);
    } finally {
        client.release();
    }
    return null;
}

export async function fetchCategoryByName(client: PoolClient, name: string[]): Promise<Category[] | null> {
    if(name === null) {
        return null;
    }

    const query = {
        name: "fetch-task-category-by-name-query",
        text: "SELECT id, name, background_color, border_color FROM task_category WHERE name = ANY($1)",
        values: [name]
    };

    try {
        const res = await client.query(query);
        if(res.rowCount !== name.length) {
            return null;
        }
        return res.rows
            .map((val: any) => parseCategory(val))
            .filter((val: Category | undefined) => val !== undefined)
            .map((val: Category | undefined) => val!);
    } catch(err: any) {
        console.error(err.stack);
    }
    return null;
}
