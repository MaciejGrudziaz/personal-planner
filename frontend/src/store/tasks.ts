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

export interface TaskCategory {
    value: "simple" | "important";
}

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

function generateId(task: TaskState): string {
    const id = task.date.year ^ task.date.month ^ task.date.day ^ task.startTime.hour ^ task.startTime.minute ^ task.endTime.hour ^ task.endTime.minute;
    console.log(id);
    return id.toFixed();
}

const initialState: TaskState[]  = [
                    {id: "task1", date: {year: 2022, month: 8, day: 12}, startTime: {hour: 12, minute: 0}, endTime: {hour: 14, minute:0}, basicInfo: "task 1 basic info", description: "task 1 description", category: {value: "important"}},
                    {id: "task2", date: {year: 2022, month: 8, day: 13}, startTime: {hour: 10, minute: 30}, endTime: {hour: 11, minute: 35}, basicInfo: "task 2 basic info", description: "task 2 description", category: {value: "simple"}},
                    {id: "task3", date: {year: 2022, month: 8, day: 14}, startTime: {hour: 14, minute: 30}, endTime: {hour: 18, minute: 30}, basicInfo: "task 3 basicInfo", description: "task 3 description", category: {value: "simple"}},
                    {id: "task4", date: {year: 2022, month: 8, day: 15}, startTime: {hour: 14, minute: 30}, endTime: {hour: 18, minute: 39}, basicInfo: "task 4 basic info", description: "task 4 description", category: {value: "simple"}},
];

export const tasksSlice = createSlice({
    name: "tasks",
    initialState,
    reducers: {
        addTasks: (state, action: PayloadAction<TaskState[]>) => {
            const tasks = action.payload;
            return state.map((val: TaskState) => {
                const task = tasks.find((secondVal: TaskState) => secondVal.id === val.id);
                if(task === undefined) {
                    return val;
                }
                return task;
            });
        },
        updateTask: (state, action: PayloadAction<TaskState>) => {
            const newTask = action.payload;
            if(newTask.id === "") {
                newTask.id = generateId(newTask);
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

