import { useDispatch } from 'react-redux';
import { TaskState, addTasks } from '../../store/tasks';
import { fetchQuery } from '../fetch';

interface Args {
    id?: string[];
    month?: number;
    year?: number;
}

function parseArgs(args: Args): string | undefined {
    if(args.id !== undefined) {
        return `id: [${args.id.join(",")}]`;
    }
    if(args.year !== undefined) {
        return (args.month !== undefined) ? `year: ${args.year}, month: ${args.month}` : `year: ${args.year}`;
    }
    return undefined;
}

type ReturnFunc = (args: Args)=>Promise<boolean>;

export function useFetchTasks(): ReturnFunc {
    const dispatch = useDispatch();

    return async (args: Args): Promise<boolean> => {
        const fetchArgs = parseArgs(args);
        if(fetchArgs === undefined) {
            return false;
        }
        try {
            const res = await fetchQuery("http://localhost:8080/", 
                `fetchTasks(${fetchArgs}) { 
                    id 
                    start_time { hour minute }
                    end_time { hour minute }
                    date { year month day }
                    basic_info
                    description
                    category
            }`);
            if(!res.ok) {
                return false;
            }
            const result = await res.json();
            dispatch(addTasks(result["data"]["fetchTasks"].map((task: any)=>{
                return {
                    id: task.id.toFixed(),
                    date: {year: task.date.year, month: task.date.month - 1, day: task.date.day},
                    startTime: (task.start_time === null) ? undefined : {hour: task.start_time.hour, minute: task.start_time.minute},
                    endTime: (task.end_time === null) ? undefined : {hour: task.end_time.hour, minute: task.end_time.minute},
                    basicInfo: (task.basic_info === null) ? "" : task.basic_info,
                    description: (task.description === null) ? "" : task.description,
                    category: task.category
                };
            })));
            return true;
        } catch(err) {
            console.error(err);
            return false;
        }
    }
}

