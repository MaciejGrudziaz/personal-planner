import { useDispatch } from "react-redux";
import { updateCalendarViewFontSize } from "../../store/config";
import { fetchMutation } from "../fetch";

interface Args {
    size: number;
}

type ReturnFunc = (args: Args) => Promise<boolean>;

export function useUpdateCalendarViewFontSize(): ReturnFunc {
    const dispatch = useDispatch();

    return async (args: Args): Promise<boolean> => {
        try {
            const methodName = "updateCalendarMonthViewFontSize";
            const res = await fetchMutation("http://localhost:8080/", `${methodName}(size: ${args.size})`);
            if(!res.ok) {
                return false;
            }
            const result = await res.json();
            if(result["data"][methodName] === true) {
                dispatch(updateCalendarViewFontSize(args.size));
                return true;
            }
            return false;
        } catch(err) {
            console.error(err);
            return false;
        }
    };
}

