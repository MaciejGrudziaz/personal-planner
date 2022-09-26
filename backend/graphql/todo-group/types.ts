import { ToDo, parseToDo } from "../todo/types";

export interface ToDoGroup {
    id: number;
    name: string;
    ordinal: number;
    tickets: ToDo[];
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

        const group = groups.get(id);
        if(group !== undefined) {
            if(task !== undefined) {
                group.tickets.push(task);
            }
            return;
        }
        groups.set(id, {id: id, name: (name) ? name : "", ordinal: ordinal, tickets: (task !== undefined) ? [task] : []});
    });

    return Array.from(groups.values());
}

