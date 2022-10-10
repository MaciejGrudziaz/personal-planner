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

export interface TaskRepetition {
    type: RepetitionType;
    count: number;
    endDate: TaskDate | undefined;
}

export type RepetitionType = "daily" | "weekly" | "monthly" | "yearly";

export interface TaskState {
    id: string;
    date: TaskDate;
    startTime: TaskTime | undefined;
    endTime: TaskTime | undefined;
    basicInfo: string;
    description: string;
    category: TaskCategory;
    repetition: TaskRepetition | undefined;
}

export function findTasksForWeek(date: Date, state: TaskState[]): TaskState[] {
    let day = date.getDay();
    day = (day === 0) ? day = 6 : day - 1;
    const msInDay = 1000 * 60 * 60 * 24;
    const startDate = new Date(date.getTime() - (day * msInDay));
    startDate.setUTCHours(0)
    startDate.setUTCMinutes(0);
    startDate.setUTCSeconds(0);
    startDate.setUTCMilliseconds(0);
    const endDate = new Date(date.getTime() + ((6 - day) * msInDay));
    endDate.setUTCHours(23);
    endDate.setUTCMinutes(59);
    endDate.setUTCSeconds(59);
    endDate.setUTCMilliseconds(999);

    return state.filter((task: TaskState)=>{
        let startHour = 0;
        let startMinute = 0;
        if(task.startTime) {
            startHour = task.startTime.hour;
            startMinute = task.startTime.minute;
        }
        const taskStartDate = new Date();
        taskStartDate.setUTCFullYear(task.date.year);
        taskStartDate.setUTCMonth(task.date.month);
        taskStartDate.setUTCDate(task.date.day);
        taskStartDate.setUTCHours(startHour);
        taskStartDate.setUTCMinutes(startMinute);
        taskStartDate.setUTCSeconds(0);
        taskStartDate.setUTCMilliseconds(0);
        return taskStartDate >= startDate && taskStartDate <= endDate;
    });
}

const initialState: TaskState[]  = [];

export const tasksSlice = createSlice({
    name: "tasks",
    initialState,
    reducers: {
        setTasks: (state, action: PayloadAction<TaskState[]>) => {
            const tasks = action.payload;
            return tasks;
        },
        updateTask: (state, action: PayloadAction<TaskState>) => {
            const newTask = action.payload;
            if(newTask.id === "") {
                return state;
            }
            if(newTask.repetition === undefined) {
                return state.filter((val: TaskState) => val.id !== newTask.id).concat(newTask);
            }
            const repetitiveTasks = state.filter((val: TaskState) => val.id === newTask.id).map((val: TaskState): TaskState => {
                return {...newTask, date: val.date};
            });
            return state.filter((val: TaskState) => val.id !== newTask.id).concat(repetitiveTasks);
        },
        updateSingleTask: (state, action: PayloadAction<TaskState>) => {
            const task = action.payload;
            if(task.id === "") {
                return state;
            }
            return state.filter((val: TaskState) => {
                return val.id !== task.id || val.date.year !== task.date.year || val.date.month !== task.date.month || val.date.day !== task.date.day;
            }).concat(task);
        },
        deleteTask: (state, action: PayloadAction<string>) => {
            const taskId = action.payload;
            return state.filter((task: TaskState) => task.id !== taskId);
        },
        deleteSingleTask: (state, action: PayloadAction<{id: string, date: TaskDate}>) => {
            const taskId = action.payload.id;
            const taskDate = action.payload.date;
            return state.filter((task: TaskState) => task.id !== taskId || task.date.year !== taskDate.year || task.date.month !== taskDate.month || task.date.day !== taskDate.day);
        }
    }
})

export const { setTasks, updateTask, updateSingleTask, deleteTask, deleteSingleTask } = tasksSlice.actions;

export default tasksSlice.reducer;

