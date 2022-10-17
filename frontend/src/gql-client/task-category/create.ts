import { useDispatch } from "react-redux";
import { Category, addCategory } from "../../store/categories";
import {fetchMutation, fetchQuery} from "../fetch";

type ReturnFunc = (category: Category) => Promise<boolean>;

export function useCreateCategory(): ReturnFunc {
    const dispatch = useDispatch();

    return async (category: Category): Promise<boolean> => {
        try {
            const env = process.env;
            const res = await fetchMutation(`http://${env.REACT_APP_BACKEND_HOST}:8080/`, `
                createCategory(
                    name: "${category.name}",
                    background_color: "${category.backgroundColor}",
                    border_color: "${category.borderColor}"
                )
            `);
            if(!res.ok) {
                return false;
            }
            const result = await res.json();
            const id = result["data"]["createCategory"];
            if(id === undefined || id === null) {
                return false;
            }
            category.id = id;
            dispatch(addCategory(category))
            return true;
        } catch(err: any) {
            console.error(err);
        }
        return false;
    };
}

