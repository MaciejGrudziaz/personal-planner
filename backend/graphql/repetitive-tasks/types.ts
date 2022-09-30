import {areAllCorrect, check} from "../../utils/type-checking";

export interface RepetitiveTask {
    id: number;
    type: number;
    count: number;
    start_date: Date;
    end_date: Date | null;
}

export function parseRepetitiveTask(val: any): RepetitiveTask | undefined {
    const id = val["id"] as number;
    const type = val["type"] as number;
    const count = val["count"] as number;
    const start_date = val["start_date"] as Date;
    const end_date = val["end_date"] as Date | null;

    if(!areAllCorrect([check(id).isNumber, check(type).isNumber, check(count).isNumber, check(start_date).isDate, check(end_date).isDate.or.isNull])) {
        return undefined;
    }

    return { id: id, type: type, count: count, start_date: start_date, end_date: end_date };
}

