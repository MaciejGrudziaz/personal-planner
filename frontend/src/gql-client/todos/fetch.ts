import { useDispatch } from "react-redux";
import { setGroups } from "../../store/todos";
import { fetchQuery } from "../fetch";

type ReturnFunc = () => Promise<boolean>;

export function useFetchTodoGroups(): ReturnFunc {
    const dispatch = useDispatch();
    return async (): Promise<boolean> => {
        try {
            const env = process.env;
            const res = await fetchQuery(`http://${env.REACT_APP_BACKEND_HOST}:8080/`,
                `fetchTodoGroups {
                    id
                    name
                    ordinal
                    tickets {
                        id
                        content
                        priority
                        done
                    }
                }`
            );
            if(!res.ok) {
                return false;
            }
            const result = await res.json();
            const groups = result["data"]["fetchTodoGroups"];
            if(groups === undefined || groups === null) {
                return false;
            }
            dispatch(setGroups(groups));
        } catch(err: any) {
            console.error(err.stack);
        }
        return false;
    };
}

