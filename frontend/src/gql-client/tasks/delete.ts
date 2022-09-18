import { useDispatch } from "react-redux";
import { TaskState, deleteTask } from "../../store/tasks";
import { fetchMutation } from "../fetch";

type ReturnFunc = (id: string) => Promise<boolean>;

export function useDeleteTask(): ReturnFunc {
    const dispatch = useDispatch();
    return async (id: string): Promise<boolean> => {
        try {
            const res = await fetchMutation("http://localhost:8080/", `deleteTask(id: ${id})`);
            if(!res.ok) {
                return false;
            }
            const result = await res.json();
            if(result["data"]["deleteTask"] === true) {
                dispatch(deleteTask(id));
                return true;
            }
            return false;
        } catch(err) {
            console.log(err);
            return false;
        }
    };
}

