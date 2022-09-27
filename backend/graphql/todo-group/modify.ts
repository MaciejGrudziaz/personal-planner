import { DBClient } from '../../db-client/client';

export async function modifyTodoGroup(db: DBClient, id: number, name?: string, ordinal?: number): Promise<boolean> {
    if(!name && !ordinal) {
        return false;
    }

    const prepareQuery = () => {
        let argCounter = 1;
        return `
            UPDATE todo_groups
            SET
                ${(name !== undefined) ? `name = $${++argCounter}` : ""}
                ${(ordinal !== undefined) ? `ordinal = $${++argCounter}` : ""}
            WHERE id = $1
        `;
    }

    const prepareQueryName = () => {
        return `update-todo-group${(name !== undefined) ? "-name" : ""}${(ordinal !== undefined) ? "-ordinal" : ""}`;
    }

    const updateTodoGroup = {
        name: prepareQueryName(),
        text: prepareQuery(),
        values: [id, name, ordinal].filter((val: any) => val !== undefined)
    };

    const client = await db.connect();
    try {
        const res = await client.query(updateTodoGroup);
        return res.rowCount === 1;
    } catch(err: any) {
        console.error(err.stack);
    } finally {
        client.release();
    }
    return false;
}

