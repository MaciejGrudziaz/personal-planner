import { useDispatch } from "react-redux";
import { Category, setCategories } from "../../store/categories";
import {fetchQuery} from "../fetch";

type ReturnFunc = () => Promise<boolean>;

export function useFetchCategories(): ReturnFunc {
    const dispatch = useDispatch();

    return async (): Promise<boolean> => {
        try {
           const res = await fetchQuery("http://localhost:8080/", `
               fetchCategories {
                   id
                   name
                   background_color
                   border_color
               }
           `)
           if(!res.ok) {
               return false;
           }
           const result = await res.json();
           const categories = result["data"]["fetchCategories"];
           if(categories === undefined || categories === null) {
               return false;
           }
           dispatch(setCategories(categories.map((val: any): Category => {
                return {
                    id: val.id,
                    name: val.name,
                    backgroundColor: val.background_color,
                    borderColor: val.border_color
                };
           })));
        } catch(err: any) {
            console.error(err.stack);
        }
        return false;
    };
}

