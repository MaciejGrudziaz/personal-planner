import {QueryResult} from "pg";
import { DBClient } from "../../db-client/client";

export interface TodoGroupOrdinal {
    id: number;
    ordinal: number;
}

function parseTodoGroupOrdinal(val: any): TodoGroupOrdinal | undefined {
    const id = val["id"] as number;
    const ordinal = val["ordinal"] as number;

    if(id === undefined || id === null
       || ordinal === undefined || ordinal === null) {
        return undefined;
    }

    return {id: id, ordinal: ordinal};
}

type MoveDirection = "up" | "down";

async function fetchAffectedGroups(db: DBClient, id: number, dir: MoveDirection): Promise<TodoGroupOrdinal[] | null> {
    const comparisionSign = (dir === "up") ? "<=" : ">=";
    const orderBy = (dir === "up") ? "DESC" : "ASC";

    const fetchAffectedGroups = {
        name: "fetch-todo-groups-by-ordinal",
        text: `
            SELECT id, ordinal
            FROM todo_groups
            WHERE ordinal ${comparisionSign} (
                SELECT ordinal
                FROM todo_groups
                WHERE id = $1
            )
            ORDER BY ordinal ${orderBy}
        `,
        values: [id]
    };

    const client = await db.connect();
    try {
        const res = await client.query(fetchAffectedGroups);
        return res.rows
            .map((val: any) => parseTodoGroupOrdinal(val))
            .filter((val: TodoGroupOrdinal | undefined) => val !== undefined)
            .map((val: TodoGroupOrdinal | undefined) => val!);
    } catch(err: any) {
        console.error(err.stack);
        client.release();
    } finally {
        client.release();
    }
    return null;
}

async function updateAffectedGroups(db: DBClient, groups: TodoGroupOrdinal[]): Promise<boolean> {
    const updateAffectedGroupsQuery = `
        UPDATE todo_groups
        SET ordinal = $2
        WHERE id = $1
    `;

    const client = await db.connect();
    try {
        const promises = groups.map((val: TodoGroupOrdinal) => {
            return client.query({name: "update-todo-groups-by-ordinal", text: updateAffectedGroupsQuery, values: [val.id, val.ordinal]});
        });
        promises.forEach(async (val: Promise<QueryResult<any>>) => await val);
        return true;
    } catch(err: any) {
        console.error(err.stack);
        client.release();
    } finally {
        client.release();
    }
    return false;
}

export async function moveTodoGroup(db: DBClient, id: number, up?: boolean, down?: boolean): Promise<TodoGroupOrdinal[] | null> {
    if(up === undefined && down === undefined) {
        return null;
    }
    if(up !== undefined && up === true && down !== undefined && down === true) {
        return null
    }
    const dir =(up !== undefined && up === true) ? "up" : "down" as MoveDirection;

    const affectedGroups = await fetchAffectedGroups(db, id, dir);
    if(affectedGroups === null) {
        return null;
    }
    if(affectedGroups.length < 2) {
        return [];
    }

    const updateOrdinals = () => {
        let ordinal = affectedGroups[0].ordinal;

        if(dir === "up") {
            return affectedGroups.map((val: TodoGroupOrdinal) => {
                return {...val, ordinal: ordinal--};
            });
        }
        return affectedGroups.map((val: TodoGroupOrdinal) => {
            ordinal += 1;
            return {...val, ordinal: ordinal++};
        });
    };

    const switchPosition = (updatedGroups: TodoGroupOrdinal[]) => {
        const first = updatedGroups[0];
        const second = updatedGroups[1];
        return [{...first, ordinal: second.ordinal}, {...second, ordinal: first.ordinal}].concat(updatedGroups.slice(2));
    };

    const updatedGroups = switchPosition(updateOrdinals());
    const res = await updateAffectedGroups(db, updatedGroups);
    if(res === false) {
        return null;
    }

    return updatedGroups;
}

