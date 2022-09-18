import { createSlice, current, PayloadAction, TaskResolved } from '@reduxjs/toolkit';

export interface TaskTime {
    hour: number;
    minute: number;
}

export function parseTimeToStr(time: TaskTime): string {
    return `${(time.hour < 10) ? '0'+time.hour.toFixed() : time.hour}:${(time.minute < 10) ? '0'+time.minute.toFixed() : time.minute}`;
}

export interface TaskDate {
    day: number;    // 1 - 31
    month: number;  // 0 - 11
    year: number;   // 4 digit
}

export function parseDateToStr(date: TaskDate): string {
    return `${date.year}-${(date.month < 9) ? '0'+(date.month + 1).toFixed() : (date.month + 1)}-${(date.day < 10) ? '0'+date.day.toFixed() : date.day}`;
}

export function parseDateToBuiltin(date: TaskDate): Date {
    return new Date(date.year, date.month, date.day);
}

export type TaskCategory = "simple" | "important";

export interface TaskState {
    id: string;
    date: TaskDate;
    startTime: TaskTime;
    endTime: TaskTime;
    basicInfo: string;
    description: string;
    category: TaskCategory;
}

export function findTasksForWeek(date: Date, state: TaskState[]): TaskState[] {
    let day = date.getDay();
    day = (day === 0) ? day = 6 : day - 1;
    const msInDay = 1000 * 60 * 60 * 24;
    const startDate = new Date(date.getTime() - (day * msInDay));
    startDate.setHours(0)
    startDate.setMinutes(0);
    startDate.setSeconds(0);
    startDate.setMilliseconds(0);
    const endDate = new Date(date.getTime() + ((6 - day) * msInDay));
    endDate.setHours(23);
    endDate.setMinutes(59);
    endDate.setSeconds(59);
    endDate.setMilliseconds(999);

    return state.filter((task: TaskState)=>{
        const taskStartDate = new Date(task.date.year, task.date.month, task.date.day, task.startTime.hour, task.startTime.minute);
        return taskStartDate >= startDate && taskStartDate <= endDate;
    });
}

const initialState: TaskState[]  = [];

export const tasksSlice = createSlice({
    name: "tasks",
    initialState,
    reducers: {
        addTasks: (state, action: PayloadAction<TaskState[]>) => {
            const tasks = action.payload;
            return state
                .filter((val: TaskState) => tasks.find((newTask: TaskState) => newTask.id === val.id) === undefined)
                .concat(tasks);
        },
        updateTask: (state, action: PayloadAction<TaskState>) => {
            const newTask = action.payload;
            if(newTask.id === "") {
                return state;
            }
            return state.filter((val: TaskState) => val.id !== newTask.id).concat(newTask);
        },
        deleteTask: (state, action: PayloadAction<string>) => {
            const taskId = action.payload;
            return state.filter((task: TaskState) => task.id !== taskId);
        }
    }
})

export const { addTasks, updateTask, deleteTask } = tasksSlice.actions;

export default tasksSlice.reducer;

