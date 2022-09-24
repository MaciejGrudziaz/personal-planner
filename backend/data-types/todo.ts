export interface ToDo {
    id: number;
    group_id: number;
    content: string;
    priority: number;
    done: boolean;
}

export interface ToDoGroup {
    id: number;
    name: string;
    ordinal: number;
    todos: ToDo[];
}

export function parseToDo(val: any): ToDo | undefined {
    const id = val["id"] as number;
    const group_id = val["group_id"] as number;
    const content = val["content"] as string | null;
    const priority = val["priority"] as number;
    const done_task_id = val["done_task_id"] as number | null;

    if(id === undefined || id === null 
       || group_id === undefined || group_id === null 
       || priority === undefined || priority === null) {
        return undefined;
    }

    return {
        id: id,
        group_id: group_id,
        content: (content !== null) ? content : "",
        priority: priority,
        done: (done_task_id !== null)
    };
}

export function parseToDoGroup(val: any[]): ToDoGroup[] {
    const groups = new Map() as Map<number, ToDoGroup>;

    val.forEach((val: any) => {
        const id = val["group_id"] as number;
        const name = val["group_name"] as string | null;
        const ordinal = val["group_ordinal"] as number;

        if(id === undefined || id === null 
           || ordinal === undefined || id === null) {
            return;
        }

        const task = parseToDo(val);
        if(task === undefined) {
            return;
        }

        const group = groups.get(id);
        if(group !== undefined) {
            group.todos.push(task);
            return;
        }
        groups.set(id, {id: id, name: (name) ? name : "", ordinal: ordinal, todos: [task]});
    });

    return Array.from(groups.values());
}

