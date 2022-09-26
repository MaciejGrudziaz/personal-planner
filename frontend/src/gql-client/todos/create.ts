import { useDispatch } from "react-redux";
import { TodoTicket, TodoGroup, createTicket, createGroup } from "../../store/todos";
import { fetchMutation } from "../fetch";

type TodoTicketReturnFunc = (ticket: TodoTicket, groupId: string) => Promise<boolean>;
type TodoGroupReturnFunc = (group: TodoGroup) => Promise<boolean>;

export function useCreateTodoTicket(): TodoTicketReturnFunc {
    const dispatch = useDispatch();
    return async (ticket: TodoTicket, groupId: string): Promise<boolean> => {
        try {
            const res = await fetchMutation("http://localhost:8080/",
                `createTodo(
                    group_id: "${groupId}",
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
            ticket.id = id;
            dispatch(createTicket({ticket: ticket, groupId: groupId}));
            return true;
        } catch(err: any) {
            console.log(err.stack);
        }
        return false;
    };
}

export function useCreateTodoGroup(): TodoGroupReturnFunc {
    const dispatch = useDispatch();
    return async (group: TodoGroup): Promise<boolean> => {
        try {
            const res = await fetchMutation("http://localhost:8080/",
                `createTodoGroup(
                    name: "${group.name},
                    ordinal: ${group.ordinal}
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
            group.id = id;
            dispatch(createGroup({groupId: id, ordinal: group.ordinal, name: group.name}));
            return true;
        } catch(err: any) {
            console.error(err.stack);
        }
        return false;
    };
}

