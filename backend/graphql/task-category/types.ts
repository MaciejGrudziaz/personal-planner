import { areAllCorrect, check } from "../../utils/type-checking";

export interface Category {
    id: number;
    name: string;
    background_color: string;
    border_color: string;
}

export function parseCategory(val: any): Category | undefined {
    const id = val["id"] as number;
    const name = val["name"] as string;
    const background_color = val["background_color"] as string;
    const border_color = val["border_color"] as string;

    if(!areAllCorrect([check(id).isNumber, check(name).isString, check(background_color).isString, check(border_color).isString])) {
        console.error("one of the values 'id', 'name', 'background_color' or 'border_color' is wrong type");
        return undefined;
    }

    return  {id: id, name: name, background_color: background_color, border_color: border_color};
}

