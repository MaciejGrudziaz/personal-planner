import { useDispatch } from "react-redux";
import { initConfig } from "../../store/config";
import { fetchQuery } from "../fetch";

type ReturnFunc = () => Promise<boolean>;

export function useFetchConfig(): ReturnFunc {
    const dispatch = useDispatch();

    return async (): Promise<boolean> => {
        const env = process.env;
        try {
            const res = await fetchQuery(`http://${env.REACT_APP_BACKEND_HOST}:8080/`,
                `config {
                    calendarMonthView {
                        fontSize
                    }
                }`
            );
            if(!res.ok) {
                return false;
            }
            const result = await res.json();
            dispatch(initConfig(result["data"]["config"]));
            return true;
        } catch(err) {
            console.error(err);
            return false;
        }
    };
}

