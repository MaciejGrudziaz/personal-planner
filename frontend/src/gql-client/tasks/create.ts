import { useDispatch } from "react-redux";
import { TaskRepetition, TaskState, updateTask } from "../../store/tasks";
import { fetchMutation } from "../fetch";

type ReturnFunc = (task: TaskState) => Promise<boolean>;

export function parseTaskRepetition(repetition: TaskRepetition | undefined): string {
    if(repetition === undefined) {
        return "null";
    }

    const parseEndDate = (): string => {
        if(repetition.endDate === undefined) {
            return "null";
        }
        return `{
            year: ${repetition.endDate.year},
            month: ${repetition.endDate.month + 1},
            day: ${repetition.endDate.day}
        }`;
    }

    return `{
        type: "${repetition.type}",
        count: ${repetition.count},
        end_date: ${parseEndDate()}
    }`;
}

export function useCreateTask(): ReturnFunc {
    const dispatch = useDispatch();
    return async (task: TaskState): Promise<boolean> => {
        try {
            const env = process.env;
            const res = await fetchMutation(`http://${env.REACT_APP_BACKEND_HOST}:8080/`,
                `createTask(
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
                    description: "${task.description.replaceAll("\n", "\\n")}",
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
            const id = result["data"]["createTask"];
            if(id === undefined || id === null) {
                return false;
            }
            task.id = id;
            dispatch(updateTask(task));
            return true;
        } catch(err) {
            console.error(err);
            return false;
        }
    };
}
