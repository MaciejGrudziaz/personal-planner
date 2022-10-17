import { useDispatch } from "react-redux";
import { Category, deleteCategory } from "../../store/categories";
import { deleteTask } from "../../store/tasks";
import { fetchMutation, fetchQuery } from "../fetch";

type ReturnFunc = (id: string, name?: string) => Promise<boolean>;

export function useDeleteCategory(): ReturnFunc {
    const dispatch = useDispatch();

    return async (id: string, name?: string): Promise<boolean> => {
        try {
            const env = process.env;
            const res = await fetchMutation(`http://${env.REACT_APP_BACKEND_HOST}:8080/`, `deleteCategory(id: ${id})`)
            if(!res.ok) {
                return false;
            }
            const result = await res.json();
            if(result["data"]["deleteCategory"] === false) {
                return false;
            }
            dispatch(deleteCategory({id: id, name: name}));
            dispatch(deleteTask({category: name}));
            return true;
        } catch(err: any) {
            console.error(err.stack);
        }
        return false;
    };
}

