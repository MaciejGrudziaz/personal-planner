import { useDispatch } from "react-redux";
import { TaskState, TaskDate, deleteTask, deleteSingleTask } from "../../store/tasks";
import { fetchMutation } from "../fetch";

type ReturnFuncAll = (id: string) => Promise<boolean>;
type ReturnFuncSingle = (id: string, date: TaskDate) => Promise<boolean>;

export function useDeleteTask(): ReturnFuncAll {
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
        } catch(err: any) {
            console.log(err.stack);
            return false;
        }
    };
}

export function useDeleteSingleTask(): ReturnFuncSingle {
    const dispatch = useDispatch();
    return async (id: string, date: TaskDate): Promise<boolean> => {
        try {
            const res = await fetchMutation("http://localhost:8080/", `deleteSingleRepetitiveTask(
                id: ${id}, 
                date: {
                    year: ${date.year}
                    month: ${date.month + 1}
                    day: ${date.day}
                }
            )`);
            if(!res.ok) {
                return false;
            }
            const result = await res.json();
            if(result["data"]["deleteSingleRepetitiveTask"] === true) {
                dispatch(deleteSingleTask({id: id, date: date}));
                return true;
            }
        } catch(err: any) {
            console.error(err.stack);
        }
        return false;
    };
}

