import { useDispatch } from 'react-redux';
import { TaskState, updateTask, updateSingleTask } from '../../store/tasks';
import { fetchMutation } from '../fetch';
import { parseTaskRepetition } from './create';

type ReturnFunc = (task: TaskState) => Promise<boolean>;

export function useUpdateTask(): ReturnFunc {
    const dispatch = useDispatch();
    return async (task: TaskState): Promise<boolean> => {
        try {
            const res = await fetchMutation("http://localhost:8080/",
                `updateTask(
                    id: ${task.id},
                    ${(task.startTime !== undefined)
                        ? `
                            start_time: {
                                hour: ${task.startTime.hour}
                                minute: ${task.startTime.minute}
                            },
                          `
                        : ""
                    }
                    ${(task.endTime !== undefined)
                        ? `
                            end_time: {
                                hour: ${task.endTime.hour}
                                minute: ${task.endTime.minute}
                            },
                          `
                        : ""
                    }
                    date: {
                        year: ${task.date.year}
                        month: ${task.date.month + 1}
                        day: ${task.date.day}
                    },
                    basic_info: "${task.basicInfo}",
                    description: "${task.description}",
                    ${(task.category !== undefined)
                        ? `category: "${task.category}",`
                        : ""
                    }
                    repetition: ${parseTaskRepetition(task.repetition)}
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
        } catch(err: any) {
            console.error(err.stack);
        }
        return false;
    };
}

export function useUpdateSingleTask(): ReturnFunc {
    const dispatch = useDispatch();
    return async (task: TaskState): Promise<boolean> => {
        try {
            const res = await fetchMutation("http://localhost:8080/",
                `updateSingleRepetitiveTask(
                    id: ${task.id},
                    date: {
                        year: ${task.date.year}
                        month: ${task.date.month + 1}
                        day: ${task.date.day}
                    },
                    ${(task.startTime !== undefined)
                        ? `
                            start_time: {
                                hour: ${task.startTime.hour}
                                minute: ${task.startTime.minute}
                            },
                        `
                        : ""
                    }
                    ${(task.endTime !== undefined)
                        ? `
                            end_time: {
                                hour: ${task.endTime.hour}
                                minute: ${task.endTime.minute}
                            }
                        `
                        : ""
                    }
                )`
            );
            if(!res.ok) {
                return false;
            }
            const result = await res.json();
            if(result["data"]["updateSingleRepetitiveTask"] === true) {
                dispatch(updateSingleTask(task));
                return true;
            }
        } catch(err: any) {
            console.error(err.stack);
        }
        return false;
    };
}

