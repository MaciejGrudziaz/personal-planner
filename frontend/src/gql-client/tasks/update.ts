import { useDispatch } from 'react-redux';
import { TaskState, updateTask } from '../../store/tasks';
import { fetchMutation } from '../fetch';

type ReturnFunc = (task: TaskState) => Promise<boolean>;

export function useUpdateTask(): ReturnFunc {
    const dispatch = useDispatch();
    return async (task: TaskState): Promise<boolean> => {
        try {
            const res = await fetchMutation("http://localhost:8080/",
                `updateTask(
                    id: ${task.id},
                    start_time: {
                        hour: ${task.startTime.hour}
                        minute: ${task.startTime.minute}
                    },
                    end_time: {
                        hour: ${task.endTime.hour}
                        minute: ${task.endTime.minute}
                    },
                    date: {
                        year: ${task.date.year}
                        month: ${task.date.month + 1}
                        day: ${task.date.day}
                    },
                    basic_info: "${task.basicInfo}",
                    description: "${task.description}",
                    category: "${task.category}"
                )`
            );
            if(!res.ok) {
                return false;
            }
            const result = await res.json();
            if(result["data"]["updateTask"] === true) {
                dispatch(updateTask(task));
                return true;
            }
            return false;
        } catch(err) {
            console.error(err);
            return false;
        }
    };
}

