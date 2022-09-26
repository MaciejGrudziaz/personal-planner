import { DBClient } from '../../db-client/client';

export async function modifyTodo(db: DBClient, id: number, content?: string, priority?: number, groupId?: number, done?: boolean): Promise<boolean> {
    const prepareUpdateQuery = () => {
        let argCounter = 1;
        return `
        UPDATE todo_tasks
        SET
            ${(content !== undefined) ? `content = $${++argCounter}` : ""}
            ${(priority !== undefined) ? `priority = $${++argCounter}` : ""}
            ${(groupId !== undefined) ? `group_id = $${++argCounter}` : ""}
        WHERE id = $1
        `
    };

    const insertDoneTasksQuery = "INSERT INTO done_tasks (task_id) VALUES ($1)";
    const deleteDoneTasksQuery = "DELETE FROM done_tasks WHERE task_id = $1";
    const fetchDoneTasksQuery = "SELECT task_id FROM done_tasks WHERE task_id = $1";

    const updateDoneTasks = async () => {
        if(done === undefined) {
            return;
        }
        const fetchRes = await client.query({name: "fetch-done-tasks", text: fetchDoneTasksQuery, values: [id]});
        if(fetchRes.rowCount === 0 && done === false) {
            return;
        }
        if(fetchRes.rowCount === 1 && done === true) {
            return;
        }

        const updateRes = (done === true)
            ? await client.query({name: "insert-done-tasks", text: insertDoneTasksQuery, values: [id]})
            : await client.query({name: "delete-done-tasks", text: deleteDoneTasksQuery, values: [id]});

        if(updateRes.rowCount !== 1) {
            throw `error: update of done_tasks for '${id}' failed`;
        }
    }

    const updateToDoQuery = {
        name: "update-todo-query",
        text: prepareUpdateQuery(),
        values: [id, content, priority, groupId].filter((val: any) => val !== undefined)
    };

    const client = await db.connect();
    try {
        await client.query("BEGIN");
        updateDoneTasks();
        if(groupId !== undefined || content !== undefined || priority !== undefined) {
            const res = await client.query(updateToDoQuery);
            if(res.rowCount !== 1) {
                throw `error: updateTodo: update of todo_tasks for '${id}' failed`;
            }
        }
        await client.query("COMMIT");
        return true;
    } catch(e: any) {
        console.error(e.stack);
        await client.query("ROLLBACK");
    } finally {
        client.release();
    }
    return false;
}

