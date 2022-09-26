import { useStore, useDispatch } from "react-redux";
import { TodoTicket, TodoGroup, modifyTicket, modifyGroup, setGroups } from "../../store/todos";
import { fetchMutation } from "../fetch";

type TodoTicketUpdateReturnFunc = (id: string, content?: string, done?: boolean) => Promise<boolean>;
type TodoGroupRenameReturnFunc = (id: string, name?: string) => Promise<boolean>;
type TodoGroupMoveReturnFunc = (id: string, dir: MoveDirection) => Promise<boolean>;
type TodoMoveReturnFunc = (id: string, target_id: string) => Promise<boolean>;

export type MoveDirection = "up" | "down";

export function useUpdateTicket(): TodoTicketUpdateReturnFunc {
    const dispatch = useDispatch();

    return async (id: string, content?: string, done?: boolean): Promise<boolean> => {
        if(content === undefined && done === undefined) {
            return true;
        }
        try {
            const res = await fetchMutation("http://localhost:8080/", 
                `modifyTodo(
                    id: ${id}, 
                    ${(content !== undefined) ? `content: "${content}",` : ""}
                    ${(done !== undefined)
                        ? (done === true) 
                            ? `done: true` : `done: false`
                        : ""
                    }
                )`
            );
            if(!res.ok) {
                return false;
            }
            const result = await res.json();
            if(result["data"]["modifyTodo"] === true) {
                dispatch(modifyTicket({ticketId: id, content: content, done: done}));
                return true;
            }
            return false;
        } catch(err: any) {
            console.error(err.stack);
        }
        return false;
    };
}

export function useMoveTicket(): TodoMoveReturnFunc {
    const dispatch = useDispatch();
    return async (id: string, target_id: string): Promise<boolean> => {
        try {
            const res = await fetchMutation("http://localhost:8080/", `moveTodo(id: ${id}, target_id: ${target_id}) { id priority }`);
            if(!res.ok) {
                return false;
            }
            const result = await res.json();
            const data = result["data"]["moveTodo"];
            if(data === undefined || data === null) {
                return false;
            }
            data.forEach((val: any) => dispatch(modifyTicket({ticketId: val["id"], priority: val["priority"]})));
            return true;
        } catch(err: any) {
            console.error(err.stack);
        }
        return false;
   };
}

export function useRenameTodoGroup(): TodoGroupRenameReturnFunc {
    const dispatch = useDispatch();
    return async (id: string, name?: string): Promise<boolean> => {
        if(name === undefined) {
            return true;
        }
        try {
            const res = await fetchMutation("http://localhost:8080/", `modifyTodoGroup(id: ${id}, name: "${name}")`);
            if(!res.ok) {
                return false;
            }
            const result = await res.json();
            if(result["datat"]["modifyTodoGroup"] === true) {
                dispatch(modifyGroup({groupId: id, name: name}));
                return true;
            }
        } catch(err: any) {
            console.error(err.stack);
        }
        return false;
    };
}

export function useMoveTodoGroup(): TodoGroupMoveReturnFunc {
    const dispatch = useDispatch();
    return async (id: string, dir: MoveDirection): Promise<boolean> => {
        try {
            const res = await fetchMutation("http://localhost:8080/",
                `moveTodoGroup(id: ${id},
                    ${(dir === "up")
                        ? "up: true"
                        : "down: true"
                    }
                ) { id ordinal }`
            );

            if(!res.ok) {
                return false;
            }
            const result = await res.json();
            const data = result["data"]["moveTodoGroup"];
            if(data === undefined || data === null) {
                return false;
            }
            data.forEach((val: any) => dispatch(modifyGroup({groupId: val["id"], ordinal: val["ordinal"]})));
            return true;
        } catch(err: any) {
            console.error(err.stack);
        }
        return false;
    };
}

