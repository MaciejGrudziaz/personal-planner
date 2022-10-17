import { useDispatch } from "react-redux";
import { TodoTicket, TodoGroup, deleteTicket, deleteGroup } from "../../store/todos";
import { fetchMutation } from "../fetch";

type ReturnFunc = (id: string) => Promise<boolean>;

export function useDeleteTodoTicket(): ReturnFunc {
    const dispatch = useDispatch();
    return async (id: string): Promise<boolean> => {
        try {
            const env = process.env;
            const res = await fetchMutation(`http://${env.REACT_APP_BACKEND_HOST}:8080/`, `deleteTodo(id: [${id}])`);
            if(!res.ok) {
                return false;
            }
            const result = await res.json();
            if(result["data"]["deleteTodo"] === true) {
                dispatch(deleteTicket({ticketId: id}));
                return true;
            }
            return false;
        } catch(err: any) {
            console.error(err.stack);
        }
        return false;
    };
}

export function useDeleteTodoGroup(): ReturnFunc {
    const dispatch = useDispatch();
    return async (id: string): Promise<boolean> => {
        try {
            const env = process.env;
            const res = await fetchMutation(`http://${env.REACT_APP_BACKEND_HOST}:8080/`, `deleteTodoGroup(id: [${id}])`);
            if(!res.ok) {
                return false;
            }
            const result = await res.json();
            if(result["data"]["deleteTodoGroup"] === true) {
                dispatch(deleteGroup({groupId: id}));
                return true;
            }
            return false;
        } catch(err: any) {
            console.error(err.stack);
        }
        return false;
    };
}

