import {check, areAllCorrect} from "../../utils/type-checking";

export interface ToDo {
    id: number;
    group_id: number;
    content: string;
    priority: number;
    done: boolean;
}

export function parseToDo(val: any): ToDo | undefined {
    const id = val["id"] as number;
    const group_id = val["group_id"] as number;
    const content = val["content"] as string | null;
    const priority = val["priority"] as number;
    const done_task_id = val["done_task_id"] as number | null;

    if(!areAllCorrect([
        check(id).isNumber, 
        check(group_id).isNumber, 
        check(content).isString.or.isNull, 
        check(priority).isNumber, 
        check(done_task_id).isNumber.or.isNull])) {
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

