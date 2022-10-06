import { DBClient } from "../../db-client/client";
import { areAllCorrect, check } from "../../utils/type-checking";

export interface TaskDate {
    id: number
    date: Date;
}

function parseTaskDate(val: any): TaskDate | undefined {
    const id = val["id"] as number;
    const date = val["date"] as Date;
    if(!areAllCorrect([check(id).isNumber, check(date).isDate])) {
        return undefined;
    }
    return {id: id, date: date};
}

export default async function fetchExcludedRepetitiveTasks(db: DBClient, ids: number[]): Promise<TaskDate[] | null> {
    const fetchExcludedRepetitiveTasksQuery = {
        name: "fetch-excluded-repetitive-tasks-query",
        text: `
            SELECT id, date
            FROM excluded_repetitive_tasks
            WHERE id = ANY ($1)
        `,
        values: [ids]
    };

    const client = await db.connect();
    try {
        const res = await client.query(fetchExcludedRepetitiveTasksQuery);
        return res.rows
            .map((val: any) => parseTaskDate(val))
            .filter((val: TaskDate | undefined) => val !== undefined)
            .map((val: TaskDate | undefined) => val!);
    } catch(err: any) {
        console.error(err.stack);
    } finally {
        client.release();
    }
    return null;
}


