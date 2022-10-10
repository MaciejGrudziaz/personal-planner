import { useDispatch } from 'react-redux';
import { TaskState, setTasks } from '../../store/tasks';
import { fetchQuery } from '../fetch';

interface Month {
    year: number;
    month: number;
}

interface Args {
    id?: string[];
    month?: number;
    year?: number;
    months?: Month[];
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

async function fetchTasks(args: Args): Promise<TaskState[] | null> {
    const fetchArgs = parseArgs(args);
    if(fetchArgs === undefined) {
        return null;
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
                repetition {
                    type
                    count
                    end_date { year month day }
                }
        }`);
        if(!res.ok) {
            return null;
        }
        const result = await res.json();
        return result["data"]["fetchTasks"].map((task: any)=>{
            return {
                id: task.id.toFixed(),
                date: {year: task.date.year, month: task.date.month - 1, day: task.date.day},
                startTime: (task.start_time === null) ? undefined : {hour: task.start_time.hour, minute: task.start_time.minute},
                endTime: (task.end_time === null) ? undefined : {hour: task.end_time.hour, minute: task.end_time.minute},
                basicInfo: (task.basic_info === null) ? "" : task.basic_info,
                description: (task.description === null) ? "" : task.description,
                category: task.category,
                repetition: (task.repetition === null) ? undefined : {
                    type: task.repetition.type,
                    count: task.repetition.count,
                    endDate: (task.repetition.end_date === null) ? undefined : {
                        year: task.repetition.end_date.year,
                        month: task.repetition.end_date.month - 1,
                        day: task.repetition.end_date.day
                    }
                }
            };
        });
    } catch(err: any) {
        console.error(err.stack);
    }
    return null;
}

export function useFetchTasks(): ReturnFunc {
    const dispatch = useDispatch();

    return async (args: Args): Promise<boolean> => {
        if(args.months === undefined) {
            const tasks = await fetchTasks(args);
            if(tasks === null) {
                dispatch(setTasks([]));
                return false;
            }
            dispatch(setTasks(tasks));
            return true;
        }
        const fetchPromises = [] as Promise<TaskState[] | null>[];
        args.months.forEach((val: Month) => {
            fetchPromises.push(fetchTasks({year: val.year, month: val.month}));
        });
        let result = [] as TaskState[];
        for(const fetchPromise of fetchPromises) {
            const tasks = await fetchPromise;
            if(tasks === null) {
                dispatch(setTasks([]));
                return false;
            }
            result = result.concat(tasks);
        }
        dispatch(setTasks(result));
        return true;
    };
}

