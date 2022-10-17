import { useDispatch } from "react-redux";
import { TodoTicket, TodoGroup, createTicket, createGroup } from "../../store/todos";
import { fetchMutation } from "../fetch";

type TodoTicketReturnFunc = (ticket: TodoTicket, groupId: string) => Promise<boolean>;
type TodoGroupReturnFunc = (name: string, ordinal: number) => Promise<boolean>;

export function useCreateTodoTicket(): TodoTicketReturnFunc {
    const dispatch = useDispatch();
    return async (ticket: TodoTicket, groupId: string): Promise<boolean> => {
        try {
            const env = process.env;
            const res = await fetchMutation(`http://${env.REACT_APP_BACKEND_HOST}:8080/`,
                `createTodo(
                    group_id: ${groupId},
                    priority: ${ticket.priority},
                    content: "${ticket.content}"
                )`
            );
            if(!res.ok) {
                return false;
            }
            const result = await res.json();
            const id = result["data"]["createTodo"];
            if(id === undefined || id === null) {
                return false;
            }
            dispatch(createTicket({ticketId: id, groupId: groupId, content: ticket.content, priority: ticket.priority}));
            return true;
        } catch(err: any) {
            console.log(err.stack);
        }
        return false;
    };
}

export function useCreateTodoGroup(): TodoGroupReturnFunc {
    const dispatch = useDispatch();
    return async (name: string, ordinal: number): Promise<boolean> => {
        try {
            const env = process.env;
            const res = await fetchMutation(`http://${env.REACT_APP_BACKEND_HOST}:8080/`,
                `createTodoGroup(
                    name: "${name}",
                    ordinal: ${ordinal}
                )`
            );
            if(!res.ok) {
                return false;
            }
            const result = await res.json();
            const id = result["data"]["createTodoGroup"];
            if(id === undefined || id === null) {
                return false;
            }
            dispatch(createGroup({groupId: id, ordinal: ordinal, name: name}));
            return true;
        } catch(err: any) {
            console.error(err.stack);
        }
        return false;
    };
}

