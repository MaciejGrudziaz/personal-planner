import { DBClient } from "../../db-client/client";
import { TaskTime, taskTimeFromString, localDateToUTC } from "../../data-types/task";
import { areAllCorrect, check } from "../../utils/type-checking";

export interface UpdatedRepetitiveTask {
    id: number;
    date: Date;
    startTime: TaskTime | null;
    endTime: TaskTime | null;
    description: string | null;
}

function parseTaskDateTime(val: any): UpdatedRepetitiveTask | undefined {
    const id = val["id"] as number;
    const date = val["date"] as Date;
    const startTime = val["start_time"] as string | null;
    const endTime = val["end_time"] as string | null;
    const description = val["description"] as string | null;

    if(!areAllCorrect([check(id).isNumber, check(date).isDate, check(startTime).isString.or.isNull, check(endTime).isString.or.isNull, check(description).isString.or.isNull])) {
        return undefined;
    }

    return {
        id: id,
        date: localDateToUTC(date),
        startTime: (startTime !== null) ? taskTimeFromString(startTime) : null,
        endTime: (endTime !== null) ? taskTimeFromString(endTime) : null,
        description: description
    };
}

export default async function fetchUpdatedRepetitiveTasks(db: DBClient, ids: number[]): Promise<UpdatedRepetitiveTask[] | null> {
    const fetchUpdatedRepetitiveTasksQuery = {
        name: "fetch-updated-repetitive-tasks-query",
        text: `
            SELECT id, date, start_time, end_time, description
            FROM changed_repetitive_tasks
            WHERE id = ANY ($1)
        `,
        values: [ids]
    };

    const client = await db.connect();
    try {
        const res = await client.query(fetchUpdatedRepetitiveTasksQuery);
        return res.rows
            .map((val: any) => parseTaskDateTime(val))
            .filter((val: UpdatedRepetitiveTask | undefined) => val !== undefined)
            .map((val: UpdatedRepetitiveTask | undefined) => val!);
    } catch(err: any) {
        console.error(err.stack);
    } finally {
        client.release();
    }
    return null;
}

