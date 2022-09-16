import { useDispatch } from 'react-redux';
import { TaskState, addTasks } from '../store/tasks';
import { fetchQuery } from './fetch';

export async function useFetchTasks(): Promise<boolean> {
    const dispatch = useDispatch();
    console.log("run useFetchTasks");
    try {
        const res = await fetchQuery("http://localhost:8080/", 
            `fetchTasks(id: [2]) { 
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
                date: {year: task.year, month: task.month, day: task.day},
                startTime: (task.start_time === null) ? {hour: 0, minute: 0} : {hour: task.start_time.hour, minute: task.start_time.minute},
                endTime: (task.end_time === null) ? {hour: 0, minute: 0} : {hour: task.end_time.hour, minute: task.end_time.minute},
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

