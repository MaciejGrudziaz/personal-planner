import { useDispatch } from "react-redux";
import { Category, updateCategory } from "../../store/categories";
import { changeCategory } from "../../store/tasks";
import {fetchMutation, fetchQuery} from "../fetch";

type ReturnFunc = (category: Category) => Promise<boolean>;
type ChangeCategoryReturnFunc = (src: string, dest: string) => Promise<boolean>;

export function useUpdateCategory(): ReturnFunc {
    const dispatch = useDispatch();

    return async (category: Category): Promise<boolean> => {
        try {
            const env = process.env;
            const res = await fetchMutation(`http://${env.REACT_APP_BACKEND_HOST}:8080/`, `
                updateCategory(
                    id: ${category.id},
                    name: "${category.name}",
                    background_color: "${category.backgroundColor}",
                    border_color: "${category.borderColor}"
                )
            `);
            if(!res.ok) {
                return false;
            }
            const result = await res.json();
            if(result["data"]["updateCategory"] === false) {
                return false;
            }
            dispatch(updateCategory(category));
            return true;
        } catch (err: any) {
            console.error(err.stack);
        }
        return false;
    };
}

export function useChangeCategory(): ChangeCategoryReturnFunc {
    const dispatch = useDispatch();

    return async (src: string, dest: string): Promise<boolean> => {
        try {
            const env = process.env;
            const res = await fetchMutation(`http://${env.REACT_APP_BACKEND_HOST}:8080/`, `changeCategory(src_category: "${src}", dest_category: "${dest}")`);
            if(!res.ok) {
                return false;
            }
            const result = await res.json();
            if(result["data"]["changeCategory"] === false) {
                return false;
            }
            dispatch(changeCategory({src: src, dest: dest}));
            return true;
        } catch(err: any) {
            console.error(err.stack);
        }
        return false;
    };
}

